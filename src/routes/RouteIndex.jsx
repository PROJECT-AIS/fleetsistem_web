import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '../components/auth/ProtectedRoute'

// Loading component
const LoadingFallback = () => (
  <div style={{ color: '#fff', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1E1F22' }}>
    <div className="flex flex-col items-center gap-4">
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #74CD25',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span>Loading...</span>
    </div>
  </div>
);

// Lazy load semua halaman agar hanya route aktif yang di-load
const HomeScreen = lazy(() => import('../components/views/home/HomeScreen'))
const Login = lazy(() => import('../components/auth/Login'))
const Register = lazy(() => import('../components/auth/Register'))
const ProfileScreen = lazy(() => import('../components/views/profile/ProfileScreen'))
const History = lazy(() => import('../components/views/history/History'))
const ConfigScreen = lazy(() => import('../components/views/config/ConfigScreen'))
const ShowConfigScreen = lazy(() => import('../components/views/showconfig/ShowConfigScreen'))

function RouteIndex() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes - redirect to home if already logged in */}
        <Route
          path='/login'
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path='/register'
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path='/history'
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path='/config'
          element={
            <ProtectedRoute>
              <ConfigScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path='/show-config'
          element={
            <ProtectedRoute>
              <ShowConfigScreen />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default RouteIndex;
