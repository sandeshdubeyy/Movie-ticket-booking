import React from 'react'
import Navbar from './components/Navbar.jsx'
import { Route ,Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.pages'
import Movies from './pages/Movies.pages'
import MovieDetails from './pages/MovieDetails.pages'
import SeatLayout from './pages/SeatLayout.pages'
import MyBookings from './pages/MyBookings.pages'
import Favourties from './pages/Favourites.home'
import Footer from './components/Footer.jsx'
import { Toaster } from 'react-hot-toast'

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')  // this gives a boolean if we are on /admin page or not
  return (
    <>
      {!isAdminRoute && <Navbar/>}
      <Toaster position='top-center' />
      <Routes> 
        <Route path='/' element={ <Home/> }/>
        <Route path='/movies' element={ <Movies/> }/>
        <Route path='/movies/:id' element={ <MovieDetails/> }/>
        <Route path='/movies/:id/:date' element={ <SeatLayout/> }/>
        <Route path='/my-bookings' element={ <MyBookings/> }/>
        <Route path='/favourites' element={ <Favourties/> }/>
      </Routes>

      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App