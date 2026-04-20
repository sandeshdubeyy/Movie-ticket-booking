import express from 'express'
import { getFavorites, getUserBookings, updateFavorite } from '../controller/user.controller.js'


const userRouter = express.Router()

userRouter.get('/bookings',getUserBookings)
userRouter.get('/favorites',getFavorites)
userRouter.post('/update-favorite',updateFavorite)

export default userRouter    