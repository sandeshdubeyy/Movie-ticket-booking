import express from 'express'
import { createBooking, getOccupuedSeats } from '../controller/booking.controller.js'


const bookingRouter = express.Router()

bookingRouter.post('/create',createBooking)
bookingRouter.get('/seats/:showId',getOccupuedSeats)


export default bookingRouter