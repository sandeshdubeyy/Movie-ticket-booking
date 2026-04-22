import React, { useMemo, useState } from "react";
import { Sparkles, X, Star } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const RecommendationWidget = () => {
  const { axios, getToken, user, navigate } = useAppContext();
  const { openSignIn } = useClerk();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  const hasRecommendations = useMemo(
    () => Array.isArray(recommendations) && recommendations.length > 0,
    [recommendations]
  );

  const getGenreText = (genre) => {
    if (Array.isArray(genre)) {
      return genre
        .map((item) => (typeof item === "string" ? item : item?.name))
        .filter(Boolean)
        .join(", ");
    }
    return typeof genre === "string" ? genre : "";
  };

  const openDialog = async () => {
    setIsOpen(true);

    if (!user) return;
    if (hasFetched) return;

    try {
      setIsLoading(true);
      setError("");

      const token = await getToken();
      const { data } = await axios.get("/api/user/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success) {
        setRecommendations(data.recommendations || []);
      } else {
        setError(data?.message || "Unable to get recommendations");
      }
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(248,69,101,0.32)] transition hover:-translate-y-0.5 hover:bg-primary-dull cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        Recommendations
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#111118]/95 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-primary/90">
                  Personalized For You
                </p>
                <h2 className="text-lg font-semibold">Movie Recommendations</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user ? (
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm">
                <p className="mb-4 text-gray-300">
                  Login to get personalized recommendations.
                </p>
                <button
                  onClick={openSignIn}
                  className="rounded-full bg-primary px-5 py-2 font-medium transition hover:bg-primary-dull cursor-pointer"
                >
                  Login
                </button>
              </div>
            ) : isLoading ? (
              <p className="py-10 text-center text-sm text-gray-300">
                Finding the best movies for you...
              </p>
            ) : error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : hasRecommendations ? (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {recommendations.map((movie, index) => (
                  <button
                    key={`${movie.title}-${index}`}
                    onClick={() => {
                      if (movie._id) {
                        navigate(`/movies/${movie._id}`);
                        setIsOpen(false);
                        scrollTo(0, 0);
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] p-4 text-left transition hover:border-primary/35 hover:bg-white/10 cursor-pointer"
                  >
                    <p className="text-base font-semibold text-white">{movie.title}</p>
                    <p className="mt-1 text-sm text-gray-300">
                      {getGenreText(movie.genre) || "Genre unavailable"}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "Release date unavailable"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {typeof movie.vote_average === "number"
                          ? movie.vote_average.toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-gray-300">
                No recommendations available right now.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RecommendationWidget;
