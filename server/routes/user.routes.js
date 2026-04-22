import express from 'express'
import { getFavorites, getUserBookings, updateFavorite } from '../controller/user.controller.js'
import { getRecommendations } from '../controller/recommendation.controller.js'


const userRouter = express.Router()

userRouter.get('/bookings',getUserBookings)
userRouter.get('/favorites',getFavorites)
userRouter.get('/recommendations',getRecommendations)
userRouter.post('/update-favorite',updateFavorite)

export default userRouter    