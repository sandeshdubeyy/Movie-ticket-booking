import axios from 'axios'
import Movie from '../models/Movie.models.js'
import Show from '../models/Show.models.js'

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
export const addShow = async (req,res) => {
    try {
        const {movieId, showsInput, showPrice}= req.body
        
        let movie = await Movie.findById(movieId)
        
        
        //if movie doesnt already exists in our databse then well fetch it from tmdb api
        if(!movie){
            const [movieDetailResponse, movieCreditResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{
                    headers:{ Authorization:`Bearer ${process.env.TMDB_API_KEY}` }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`,{
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
                genre: movieApiData.genres,
                casts: movieCreditsData.cast,
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }
            
            //now adding in db
            movie = await Movie.create(movieDetails)
        }


        //for admin to add shows manually
        const showsToCreate = []
        showsInput.forEach(show => {
            const showDate =show.date
            show.time.forEach((time)=>{
                const dateTimeString = `${showDate}T${time}`
                showsToCreate.push({
                    movie:movieId,
                    showDateTime:new Date(dateTimeString),
                    showPrice,
                    occupiedSeats:{}
                })
            })
        })

        if(showsToCreate.length>0){
            await Show.insertMany(showsToCreate)
        }

        res.json({success:true,message:'Show addded succesfully.'})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to get many shows from our database
export const getShows = async (req,res) => {
    try {
        const shows = await Show.find({showDateTime: {$gte:new Date()}}).populate('movie').sort({showDateTime: 1}) // 1 means ascending and -1 means decending
        const uniqueShows = new Set(shows.map(show => show.movie))
        res.json({success:true,shows:Array.from(uniqueShows)})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message}) 
    }
}

// api to get just one show from our database

export const getShow = async (req,res) => {
    try {
        const {movieId} = req.params

        //get all upcoming shows for user to select a show for movie
        const shows = await Show.find({movie:movieId,showDateTime:{$gte: new Date()}})

        const movie = await Movie.findById(movieId)
        const dateTime = {}

        shows.forEach((show)=>{
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){ // if it is undefined, only runs once for each date
                dateTime[date]=[]
            }
            dateTime[date].push({time :show.showDateTime, showId :show._id})
        })
        res.json({success:true,movie,dateTime})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}