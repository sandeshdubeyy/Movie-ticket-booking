import express from 'express'
import { createBooking, getOccupuedSeats, mockPayBooking } from '../controller/booking.controller.js'


const bookingRouter = express.Router()

bookingRouter.post('/create',createBooking)
bookingRouter.get('/seats/:showId',getOccupuedSeats)
bookingRouter.post('/pay/:bookingId', mockPayBooking)


export default bookingRouter