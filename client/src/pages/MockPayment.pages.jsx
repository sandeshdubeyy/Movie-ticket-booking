import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext.jsx'

const MockPayment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectBookingId = searchParams.get('bookingId') || ''

  const { axios, getToken, user } = useAppContext()
  const currency = import.meta.env.VITE_CURRENCY

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(preselectBookingId)
  const [qrUrl, setQrUrl] = useState('')

  const mockPayUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/mock-pay'
    return `${window.location.origin}/mock-pay`
  }, [])

  const loadBookings = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      if (!data.success) {
        toast.error(data.message || 'Failed to load bookings')
        setBookings([])
        return
      }

      const list = Array.isArray(data.bookings) ? data.bookings : []
      setBookings(list)

      if (!selectedBookingId) {
        const firstUnpaid = list.find((b) => !b.isPaid)
        if (firstUnpaid?._id) setSelectedBookingId(firstUnpaid._id)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to load bookings')
    }
  }

  useEffect(() => {
    if (!user) return
    const run = async () => {
      setIsLoading(true)
      await loadBookings()
      setIsLoading(false)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const run = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(mockPayUrl, { width: 220, margin: 1 })
        setQrUrl(dataUrl)
      } catch (error) {
        console.log(error)
      }
    }
    run()
  }, [mockPayUrl])

  const unpaidBookings = bookings.filter((b) => !b.isPaid)
  const selectedBooking = bookings.find((b) => b._id === selectedBookingId)

  const submitPayment = async () => {
    if (!selectedBookingId) {
      toast.error('Please select a booking')
      return
    }

    try {
      setIsSubmitting(true)
      const { data } = await axios.post(
        `/api/booking/pay/${selectedBookingId}`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (!data.success) {
        toast.error(data.message || 'Payment failed')
        return
      }

      toast.success(data.message || 'Payment successful')
      await loadBookings()
      navigate('/my-bookings')
    } catch (error) {
      console.log(error)
      toast.error('Payment failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <p className="text-gray-300">Please login to continue.</p>
      </div>
    )
  }

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="120px" left="120px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">Mock Payment</h1>

      <div className="max-w-3xl bg-primary/8 border border-primary/20 rounded-lg p-5">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-300">Scan (same QR for everyone)</p>
            {qrUrl ? (
              <img src={qrUrl} alt="Mock payment QR" className="w-[200px] h-[200px] rounded bg-white p-2" />
            ) : (
              <div className="w-[200px] h-[200px] rounded bg-white/10 flex items-center justify-center text-xs text-gray-300">
                Loading QR…
              </div>
            )}
            <p className="text-xs text-gray-400">This is a demo flow (no UPI integration).</p>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">Choose booking to pay</p>

            {unpaidBookings.length === 0 ? (
              <div className="text-sm text-gray-400">
                You have no unpaid bookings.
              </div>
            ) : (
              <>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                >
                  {unpaidBookings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.show?.movie?.title || 'Movie'} — {currency}
                      {b.amount} — {String(b._id).slice(-6)}
                    </option>
                  ))}
                </select>

                <div className="mt-3 text-sm text-gray-400">
                  {selectedBooking ? (
                    <div className="space-y-1">
                      <p>
                        <span className="text-gray-300">Movie:</span> {selectedBooking.show?.movie?.title || '—'}
                      </p>
                      <p>
                        <span className="text-gray-300">Amount:</span> {currency}
                        {selectedBooking.amount}
                      </p>
                      <p>
                        <span className="text-gray-300">Booking ID:</span> {selectedBooking._id}
                      </p>
                    </div>
                  ) : (
                    <p>Select a booking to see details.</p>
                  )}
                </div>

                <button
                  onClick={submitPayment}
                  disabled={isSubmitting}
                  className="mt-5 bg-primary px-5 py-2 text-sm rounded-full font-medium disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default MockPayment

