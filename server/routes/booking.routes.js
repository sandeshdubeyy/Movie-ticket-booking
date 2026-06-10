import express from 'express'
import { createBooking, getOccupuedSeats, createOrder, verifyPayment } from '../controller/booking.controller.js'


const bookingRouter = express.Router()

bookingRouter.post('/create',createBooking)
bookingRouter.get('/seats/:showId',getOccupuedSeats)
bookingRouter.post('/create-order/:bookingId',createOrder)
bookingRouter.post('/verify-payment', verifyPayment)

export default bookingRouter