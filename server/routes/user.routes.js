import express from 'express'
import { getFavorites, getUserBookings, updateFavorite } from '../controller/user.controller.js'


const userRouter = express.Router()

adminRouter.get('/bookings',getUserBookings)
adminRouter.get('/favorites',getFavorites)
adminRouter.post('/update-favorite',updateFavorite)

export default userRouter    