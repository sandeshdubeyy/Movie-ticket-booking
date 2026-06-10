import User from "../models/User.models.js";
import Booking from "../models/Booking.models.js";
import Show from "../models/Show.models.js"
import razorpayInstance from "../configs/razorpay.configs.js";
import crypto from 'crypto'

// check if theres any seat available or not
export const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats

        const isAnySeatTaken = selectedSeats.some(seat=>occupiedSeats[seat]) // if same seat is found it return true

        return !isAnySeatTaken // since well get true for selected seats being selected again thats why we are sending it with !
    } catch (error) {
        console.log(error.message);
        return false;   
    }
}

export const createBooking = async (req,res) => {
    try {
        const {userId} = req.auth()
        const {origin}= req.headers
        const {showId,selectedSeats} = req.body

        // using the function above to check availability
        const isAvailable = await checkSeatsAvailability(showId,selectedSeats)

        if(!isAvailable){
            return res.json({success:false, message: "Selected Seats are not available"})
        }

        //if seat is there get show data
        const showData = await Show.findById(showId).populate('movie')

        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })
        
        // now update that these seats are sold in the database so it cant be purchased by anyone
        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat]=userId // key and value pair ki working hai
        })

        showData.markModified('occupiedSeats')

        await showData.save()

        // payment gateway here...
            res.json({
                success:true,
                message:'Booked successfully!'
            })
    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.message
        })
    }
}

// get occupied seats data

export const getOccupuedSeats = async (req,res) => {
    try {
        const {showId} =req.params
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({
                success:true,
                occupiedSeats
            })

    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const createOrder = async (req,res) => {
    try {
        
        const {userId} = req.auth()
        const {bookingId} = req.params

        if(!userId){
            return res.json({success:false, message: "Login to proceed"})
        }

        const booking = await Booking.findOne({
            _id:bookingId,
            user:userId
        })

        if(!booking){
            return res.json({success:false, message: "Booking not found"})
        }

        if(booking.isPaid){
            return res.json({success:false, message: "Payment is already done"})
        }

        const order = await razorpayInstance.orders.create({
            amount: booking.amount*100,
            currency:'INR',
            receipt:`booking_${booking._id}`
        })

        res.json({
            success:true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        })

    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const verifyPayment = async (req,res) => {
    try {
        const {userId} = req.auth()
        const {bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body

        if(!userId){
            return res.json({success:false, message: "Login to proceed"})
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
        .createHmac('sha256',process.env.RAZORPAY_TEST_SECRET_KEY)
        .update(body)
        .digest('hex')

        if(expectedSignature != razorpay_signature){
            return res.json({ success: false, message: 'Invalid payment signature' })
        }

        const booking = await Booking.findOne({ _id: bookingId, user: userId })

        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' })
        }
        if (booking.isPaid) {
            return res.json({ success: true, message: 'Already paid' })
        }
        
        booking.isPaid = true
        booking.paymentLink = razorpay_payment_id
        
        await booking.save()
        
        res.json({ success: true, message: 'Payment verified' })
    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.message
        })
    }
}