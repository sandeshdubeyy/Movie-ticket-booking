import React, { useEffect, useMemo, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import dateFormat from '../lib/dateFormat.js'
import { useAppContext } from '../context/AppContext.jsx'
import QRCode from 'qrcode'

const MyBookings = () => {
  const {axios, getToken, user, image_base_url}= useAppContext()
  

  const currency = import.meta.env.VITE_CURRENCY

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [mockPayQrUrl, setMockPayQrUrl] = useState('')

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings',{headers:{
                Authorization: `Bearer ${await getToken()}`
            }})
            if(data.success){
              setBookings(data.bookings)
            }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false)
  }

  useEffect(()=>{
    if(user){
      getMyBookings()
    }
  },[user])

  const mockPayUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/mock-pay'
    return `${window.location.origin}/mock-pay`
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(mockPayUrl, { width: 180, margin: 1 })
        setMockPayQrUrl(dataUrl)
      } catch (error) {
        console.log(error)
      }
    }
    run()
  }, [mockPayUrl])

  return !isLoading ? (
    
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top='100px' left='100px'/>
      <div>
        <BlurCircle bottom='0px' left='600px'/>
      </div>
      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>

      {bookings.map((item,index)=> (
        <div key={index} className='flex flex-col md:flex-row justify-between bg-primary/8 primary border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>
          <div className='flex flex-col md:flex-row'>
            <img src={image_base_url+item.show.movie.poster_path} alt="" className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'/>

            <div className='flex flex-col p-4'>
              <p className='text-lg font-semibold'>{item.show.movie.title}</p>
              <p className='text-gray-400 text-sm'>{timeFormat(item.show.movie.runtime)}</p>
              <p className='text-gray-400 text-sm mt-auto'>{dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>
          
          <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
            <div className='flex items0-center gap-4'>
              <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
            </div>
            <div className='text-sm'>
                <p><span className='text-gray-400'>Total tickets:</span>{item.bookedSeats.length}</p>
                <p><span className='text-gray-400'>Seat number::</span>{item.bookedSeats.join(", ")}</p>
            </div>

            {!item.isPaid && (
              <div className='mt-4 flex flex-col md:items-end gap-2'>
                {mockPayQrUrl ? (
                  <img
                    src={mockPayQrUrl}
                    alt="Mock payment QR"
                    className='w-[150px] h-[150px] rounded bg-white p-2'
                  />
                ) : (
                  <div className='w-[150px] h-[150px] rounded bg-white/10 flex items-center justify-center text-xs text-gray-300'>
                    Loading QR…
                  </div>
                )}

                <a
                  href={`/mock-pay?bookingId=${item._id}`}
                  className='bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer inline-block'
                >
                  Open payment page
                </a>

                <p className='text-xs text-gray-400 max-w-[240px] md:text-right'>
                  Scan the QR to open the mock payment page, then select this booking and submit.
                </p>
              </div>
            )}
          </div>
        </div>

      ))}
    </div>
  ) : <Loading/>
}

export default MyBookings