import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

// Lazy load semua halaman agar hanya route aktif yang di-load
const HomeScreen = lazy(() => import('../components/views/home/HomeScreen'))
const Login = lazy(() => import('../components/auth/Login'))
const Register = lazy(() => import('../components/auth/Register'))
const ProfileScreen = lazy(() => import('../components/views/profile/ProfileScreen'))
const History = lazy(() => import('../components/views/history/History'))

function RouteIndex() {
  return (
    <Suspense fallback={<div style={{color:'#fff', padding:16}}>Loading...</div>}>
      <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/profile' element={<ProfileScreen />} />
          <Route path='/history' element={<History />} />
      </Routes>
    </Suspense>
  )
}

export default RouteIndex;
