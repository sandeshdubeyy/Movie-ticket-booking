import axios from 'axios'
import Movie from '../models/Movie.models.js'

//api to get now playing movies from tm db database 
export const getNowPlayingMovies = async (req,res) => {
    try {
        const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers:{
                Authorization:`Bearer ${process.env.TMDB_API_KEY}`
            }
        })
        const movies = data.results
        res.json({success:true,movies:movies})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to add new show on the app
export const addShow = async () => {
    try {
        const {movieId, showsInput, showprice}= req.body

        let movie = await Movie.findById(movieId)
        
        //if movie doesnt already exists in our databse then well fetch it from tmdb api
        if(!movie){
            const [movieDetailResponse, movieCreditResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/{movieId}`,{
                    headers:{ Authorization:`Bearer ${process.env.TMDB_API_KEY}` }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/{movieId}/credits`,{
                    headers:{ Authorization:`Bearer ${process.env.TMDB_API_KEY}` }
                })

            ])
            const movieApiData = movieDetailResponse.data
            const movieCreditsData = movieCreditResponse.data

            //creating an object to store in db
            const movieDetails= {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                release_date: movieApiData.release_date,
                original_language:movieApiData.original_language,
                tagline:movieApiData.tagline,
                genre: movieApiData.genre,
                casts: movieApiData.casts,
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }

            //now adding in db
            movie = await Movie.create(movieDetails)
        }

        showsToCreate
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}