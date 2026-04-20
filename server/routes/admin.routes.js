import express from 'express'
import { protectAdmin } from '../middleware/auth.middlewar.js'
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../controller/admin.controller'

const adminRouter = express.Router()

adminRouter.get('/isAdmin',protectAdmin,isAdmin)
adminRouter.get('/dashboard',getDashboardData)
adminRouter.get('/all-shows',getAllShows)
adminRouter.get('/all-bookings',getAllBookings)

export default adminRouter    