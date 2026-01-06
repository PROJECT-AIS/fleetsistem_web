import { Car, ChevronLeft, ChevronRight, Clock, Compass } from 'lucide-react'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function SideBar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  return (
    <div
      className={`
        min-h-screen flex flex-col bg-transparent shadow-2xl border-r border-[#343538] py-8 px-4
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64' : 'w-20 items-center'}
      `}
    >
      <button
        className="self-end p-3 rounded-full bg-[#343538] text-gray-400 hover:bg-gray-600 transition-colors duration-200 mb-3"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-7 h-7" />
        ) : (
          <ChevronRight className="w-7 h-7" />
        )}
      </button>

      <nav className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold shadow transition
            ${isActive('/') ? 'bg-[#74CD25] text-white' : 'bg-transparent text-white hover:bg-[#343538]'}
            ${!isSidebarOpen ? 'justify-center w-auto' : ''}
          `}
        >
          <Car className="w-6 h-6" />
          {isSidebarOpen && "Dashboard"}
        </button>

        <button
          onClick={() => navigate('/history')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold shadow transition
            ${isActive('/history') ? 'bg-[#74CD25] text-white' : 'bg-transparent text-white hover:bg-[#343538]'}
            ${!isSidebarOpen ? 'justify-center w-auto' : ''}
          `}
        >
          <Clock className="w-6 h-6" />
          {isSidebarOpen && "History Data"}
        </button>

        <button
          onClick={() => navigate('/kalibrasi')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold shadow transition
            ${isActive('/kalibrasi') ? 'bg-[#74CD25] text-white' : 'bg-transparent text-white hover:bg-[#343538]'}
            ${!isSidebarOpen ? 'justify-center w-auto' : ''}
          `}
        >
          <Compass className="w-6 h-6" />
          {isSidebarOpen && "Kalibrasi"}
        </button>
      </nav>
    </div>
  )
}
