import { Inngest } from "inngest";
import User from "../models/User.models.js";
import Booking from "../models/Booking.models.js";
import sendEmail from "../configs/nodemailer.configs.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" }); // creating client to send req

//functions/controllers

//1 create user
const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
        triggers: [{ event: 'clerk/user.created' }]
    },
    async ({event}) =>{
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id:id,
            name:first_name + ' ' +last_name,
            email: email_addresses[0].email_address,
            image:image_url
        }
        await User.create(userData)
    }
)

//2 delete user
const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk',
        triggers: [{ event: 'clerk/user.deleted' }]
    },
    async ({event}) =>{
            const {id} =event.data
            await User.findByIdAndDelete(id)
        }
)

//3 update user data
const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk',
        triggers: [{ event: 'clerk/user.updated' }]
    },
    async ({event}) =>{
            const {id, first_name, last_name, email_addresses, image_url} = event.data
            const userData = {
            _id:id,
            name:first_name + ' ' +last_name,
            email: email_addresses[0].email_address,
            image:image_url
        }
        await User.findByIdAndUpdate(id,userData)
    }
)

const sendBookingConfirmation = inngest.createFunction(
    {
        id: "send-booking-confirmation-email",
        triggers: [{ event: "app/show.booked" }]
    },
    async ({ event, step }) => {

        const { bookingId } = event.data;
        console.log('inngest: sendBookingConfirmation triggered for booking', bookingId)

        const booking = await Booking.findById(bookingId)
            .populate({
                path: "show",
                populate: {
                    path: "movie",
                    model: "Movie"
                }
            })
            .populate("user");

        await sendEmail({
            to: booking.user.email,
            subject:`Payment confirmation: "${booking.show.movie.title}" booked!`,
            body:`<div style="font-family: Arial, sans-serif; line-height: 1.5;">
                 <h2>Hi ${booking.user.name}</h2>
                <p>
                    Your booking for
                    <strong style="color: #F84565;">
                        ${booking.show.movie.title}
                    </strong>
                    is confirmed.
                </p>
                <p>
                    <strong>Date:</strong>
                    ${new Date(booking.show.showDateTime).toLocaleDateString(
                        "en-US",
                        { timeZone: "Asia/Kolkata" }
                    )}
                    <br/>
                    <strong>Time:</strong>
                    ${new Date(booking.show.showDateTime).toLocaleTimeString(
                        "en-US",
                        { timeZone: "Asia/Kolkata" }
                    )}
                </p>
                <p>Enjoy the show!</p>
                <p>
                    Thanks for booking with us!
                    <br/>
                    - QuickShow Team
                </p>
            </div>`
        })
    }
)


export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdation,sendBookingConfirmation]  // array in which functions will be stored
