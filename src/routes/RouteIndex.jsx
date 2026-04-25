import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '../components/auth/ProtectedRoute'
import { MqttProvider } from '../context/MqttContext.jsx'

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
const Analysis = lazy(() => import('../components/views/analysis/Analysis'))
const Statistics = lazy(() => import('../components/views/statistics/Statistics'))
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
              <ConfigScreen manageHref="/parameter/view" />
            </ProtectedRoute>
          }
        />
        <Route
          path='/show-config'
          element={
            <ProtectedRoute>
              <Navigate to='/parameter/view' replace />
            </ProtectedRoute>
          }
        />
        <Route
          path='/setup/view'
          element={
            <ProtectedRoute>
              <ShowConfigScreen
                defaultTab="kalibrasi"
                pageTitle="View Setup"
                pageDescription="Menampilkan data setup seperti user management dan sensor calibration."
                visibleTabs={["kalibrasi", "users"]}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/setup/user-management'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="user-management"
                pageTitle="Setup"
                pageDescription="Kelola user management dan sensor calibration sesuai struktur sidebar baru."
                showPrimaryTabs={false}
                showInputTabs={false}
                manageHref="/setup/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/setup/sensor-calibration'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="kalibrasi"
                pageTitle="Setup"
                pageDescription="Kelola user management dan sensor calibration sesuai struktur sidebar baru."
                showPrimaryTabs={false}
                showInputTabs={false}
                manageHref="/setup/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/entry'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="shift-code"
                pageTitle="Entry Parameter"
                pageDescription="Input parameter dipisahkan per kategori menggunakan tab agar entry data lebih rapi."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/view'
          element={
            <ProtectedRoute>
              <ShowConfigScreen
                defaultTab="shift-code"
                pageTitle="View Parameter"
                pageDescription="Menampilkan config parameter yang saat ini sudah tersimpan di sistem."
                visibleTabs={["shift-code", "material-type", "alat", "operator", "lokasi"]}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/equipment'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="alat"
                pageTitle="Parameter"
                pageDescription="Input parameter dipisahkan per kategori menggunakan tab agar entry data lebih rapi."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/location'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="lokasi"
                pageTitle="Parameter"
                pageDescription="Input parameter dipisahkan per kategori menggunakan tab agar entry data lebih rapi."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/operator'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="operator"
                pageTitle="Parameter"
                pageDescription="Input parameter dipisahkan per kategori menggunakan tab agar entry data lebih rapi."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/shift-code'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="shift-code"
                pageTitle="Parameter"
                pageDescription="Kelola parameter shift code sesuai datasheet operasional."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/parameter/material-type'
          element={
            <ProtectedRoute>
              <ConfigScreen
                defaultTab="input-data"
                defaultInputTab="material-type"
                pageTitle="Parameter"
                pageDescription="Kelola parameter material type sesuai datasheet jenis muatan."
                showPrimaryTabs={false}
                showInputTabs
                inputTabMode="parameter"
                manageHref="/parameter/view"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path='/analysis'
          element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          }
        />
        <Route
          path='/statistics'
          element={
            <ProtectedRoute>
              <MqttProvider>
                <Statistics />
              </MqttProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default RouteIndex;
