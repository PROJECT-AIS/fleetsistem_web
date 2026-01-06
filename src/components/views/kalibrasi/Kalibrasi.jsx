import React from 'react'
import Header from '../../utils/Header'
import SideBar from '../../utils/sidebar/SideBar'

export default function Kalibrasi() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#1E1F22" }}>
      {/* Header */}
      <Header />
      <div className="flex flex-1">
        <SideBar />
      </div>
    </div>
  )
}
