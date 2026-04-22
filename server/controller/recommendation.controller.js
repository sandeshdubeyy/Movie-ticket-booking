import axios from "axios";
import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.models.js";
import Movie from "../models/Movie.models.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const RECOMMENDATION_LIMIT = 5;

const extractRawJson = (content = "") => {
  const trimmed = String(content).trim();
  if (!trimmed) return "[]";

  // Sometimes models wrap JSON in markdown fences even when instructed not to.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  return trimmed;
};

export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: false, message: "Please login to continue" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        success: false,
        message: "OPENROUTER_API_KEY is missing in environment variables",
      });
    }

    const user = await clerkClient.users.getUser(userId);
    const favoriteMovieIds = Array.isArray(user?.privateMetadata?.favorites)
      ? user.privateMetadata.favorites
      : [];

    const paidBookings = await Booking.find({ user: userId, isPaid: true })
      .select("show")
      .populate({ path: "show", select: "movie" });

    const watchedMovieIds = paidBookings
      .map((booking) => booking?.show?.movie)
      .filter(Boolean);

    const excludedMovieIds = [...new Set([...favoriteMovieIds, ...watchedMovieIds])];

    const moviesFromDB = await Movie.find({
      _id: { $nin: excludedMovieIds },
    })
      .select("_id title genre release_date vote_average")
      .lean();

    if (!moviesFromDB.length) {
      return res.json({
        success: false,
        message: "No movies available to recommend right now",
      });
    }

    const favoriteMovies = favoriteMovieIds.length
      ? await Movie.find({ _id: { $in: favoriteMovieIds } }).select("title").lean()
      : [];

    const favoriteMovieTitles = favoriteMovies.map((movie) => movie.title).filter(Boolean);
    const watchedMovies = await Movie.find({ _id: { $in: watchedMovieIds } })
      .select("title")
      .lean();
    const watchedMovieTitles = watchedMovies.map((movie) => movie.title).filter(Boolean);

    const userPrompt = `
You must ONLY recommend movies from the provided dataset.
Do not suggest anything outside it.

Available movies dataset:
${JSON.stringify(moviesFromDB)}

Favorite movies:
${favoriteMovieTitles.join(", ") || "None"}

Movies already watched/booked:
${watchedMovieTitles.join(", ") || "None"}

Recommend exactly ${RECOMMENDATION_LIMIT} movies from the dataset that best match the user's taste.
Return ONLY a raw JSON array (no markdown, no extra text).
Format:
[{"title":"","genre":[],"release_date":"","vote_average":0}]
`;

    const aiResponse = await axios.post(
      OPENROUTER_URL,
      {
        model: "anthropic/claude-sonnet-4-6",
        messages: [
          {
            role: "system",
            content:
              "You are a movie recommendation assistant. Only choose movies from the user's provided dataset and return only a valid raw JSON array.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = aiResponse?.data?.choices?.[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(extractRawJson(content));

    if (!Array.isArray(parsed)) {
      return res.json({
        success: false,
        message: "Invalid recommendation format from AI service",
      });
    }

    const movieById = new Map(moviesFromDB.map((movie) => [String(movie._id), movie]));
    const movieByTitle = new Map(moviesFromDB.map((movie) => [movie.title, movie]));

    const normalized = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const possibleId = item._id ? String(item._id) : "";
        const possibleTitle = item.title ? String(item.title) : "";
        return movieById.get(possibleId) || movieByTitle.get(possibleTitle) || null;
      })
      .filter(Boolean)
      .filter(
        (movie, index, arr) =>
          arr.findIndex((candidate) => String(candidate._id) === String(movie._id)) === index
      )
      .slice(0, RECOMMENDATION_LIMIT);

    return res.json({ success: true, recommendations: normalized });
  } catch (error) {
    console.log("Recommendation controller error:", error?.response?.data || error.message);
    return res.json({ success: false, message: "Failed to generate recommendations" });
  }
};
