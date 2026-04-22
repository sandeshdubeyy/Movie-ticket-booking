import React from 'react'
import Navbar from './components/Navbar.jsx'
import { Route ,Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.pages'
import Movies from './pages/Movies.pages'
import MovieDetails from './pages/MovieDetails.pages'
import SeatLayout from './pages/SeatLayout.pages'
import MyBookings from './pages/MyBookings.pages'
import Favourties from './pages/Favourites.pages.jsx'
import Footer from './components/Footer.jsx'
import { Toaster } from 'react-hot-toast'
import Layout from './pages/admin/Layout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import AddShows from './pages/admin/AddShows.jsx'
import ListShows from './pages/admin/ListShows.jsx'
import ListBookings from './pages/admin/ListBookings.jsx'
import { useAppContext } from './context/AppContext.jsx'
import { SignIn } from '@clerk/clerk-react'

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')  // this gives a boolean if we are on /admin page or not
  
  const {user} = useAppContext()
  
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

        {/* admin routes */}
        <Route path='/admin/*' element={user ? <Layout/> : (
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={'/admin'}/>
          </div>
        )}>
          <Route index element={<Dashboard/>}/>
          <Route path='add-shows' element={<AddShows/>}/>
          <Route path='list-shows' element={<ListShows/>}/>
          <Route path='list-bookings' element={<ListBookings/>}/>
        </Route>

      </Routes>

      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App