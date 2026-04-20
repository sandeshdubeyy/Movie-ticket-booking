import Booking from "../models/Booking.models.js";
import Show from "../models/Show.models.js"

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