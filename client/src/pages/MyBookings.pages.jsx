import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import dateFormat from '../lib/dateFormat.js'
import { useAppContext } from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

const MyBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext()

  const currency = import.meta.env.VITE_CURRENCY

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [payingBookingId, setPayingBookingId] = useState(null)

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.log(error)
    }
    setIsLoading(false)
  }

  const handlePayNow = async (bookingId, movieTitle) => {
    if (payingBookingId) return

    try {
      setPayingBookingId(bookingId)

      const { data } = await axios.post(
        `/api/booking/create-order/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (!data.success) {
        toast.error(data.message || 'Could not start payment')
        setPayingBookingId(null)
        return
      }

      if (!window.Razorpay) {
        toast.error('Razorpay failed to load. Please refresh the page.')
        setPayingBookingId(null)
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'Movie Ticket Booking',
        description: movieTitle,
        prefill: {
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        handler: async function (response) {
          try {
            const { data: verifyData } = await axios.post(
              '/api/booking/verify-payment',
              {
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${await getToken()}` } }
            )

            if (verifyData.success) {
              toast.success('Payment successful')
              await getMyBookings()
            } else {
              toast.error(verifyData.message || 'Payment verification failed')
            }
          } catch (error) {
            console.log(error)
            toast.error('Payment verification failed')
          } finally {
            setPayingBookingId(null)
          }
        },
        modal: {
          ondismiss: () => setPayingBookingId(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed')
        setPayingBookingId(null)
      })
      rzp.open()
    } catch (error) {
      console.log(error)
      toast.error('Could not start payment')
      setPayingBookingId(null)
    }
  }

  useEffect(() => {
    if (user) {
      getMyBookings()
    }
  }, [user])

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top='100px' left='100px' />
      <div>
        <BlurCircle bottom='0px' left='600px' />
      </div>
      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={item._id || index}
          className='relative z-10 flex flex-col md:flex-row justify-between bg-primary/8 primary border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'
        >
          <div className='flex flex-col md:flex-row'>
            <img
              src={image_base_url + item.show.movie.poster_path}
              alt=''
              className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'
            />

            <div className='flex flex-col p-4'>
              <p className='text-lg font-semibold'>{item.show.movie.title}</p>
              <p className='text-gray-400 text-sm'>{timeFormat(item.show.movie.runtime)}</p>
              <p className='text-gray-400 text-sm mt-auto'>{dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>

          <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
            <div className='flex items-center gap-4'>
              <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
              {!item.isPaid && (
                <button
                  type='button'
                  onClick={() => handlePayNow(item._id, item.show.movie.title)}
                  disabled={payingBookingId === item._id}
                  className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {payingBookingId === item._id ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
            <div className='text-sm'>
              <p>
                <span className='text-gray-400'>Total tickets:</span>
                {item.bookedSeats.length}
              </p>
              <p>
                <span className='text-gray-400'>Seat number::</span>
                {item.bookedSeats.join(', ')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Loading />
  )
}

export default MyBookings
