import { Car, ChevronLeft, ChevronRight, Clock, Settings, Table2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function SideBar() {
  // Persist sidebar state in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved === 'true'
  })
  const location = useLocation()
  const navigate = useNavigate()

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen)
  }, [isSidebarOpen])

  const isActive = (path) => location.pathname === path

  const menuItems = [
    { path: '/', icon: Car, label: 'Dashboard' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/config', icon: Settings, label: 'Config' },
    { path: '/show-config', icon: Table2, label: 'Show Config' },
  ]

  return (
    <div className="min-h-screen flex flex-col py-6 px-3">
      {/* Sidebar Card Container - Full Height */}
      <div
        className={`
          bg-[#343538] rounded-2xl shadow-xl flex flex-col flex-1
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-52 px-4 py-5' : 'w-16 px-2 py-5 items-center'}
        `}
      >
        {/* Toggle Button */}
        <button
          className={`
            p-2 rounded-xl bg-[#4A4B4D] text-gray-300 hover:bg-[#5A5B5D] hover:text-white 
            transition-all duration-200 mb-6
            ${isSidebarOpen ? 'self-end' : 'self-center'}
          `}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center gap-3 rounded-xl font-semibold transition-all duration-200
                  ${isSidebarOpen ? 'px-4 py-3' : 'p-3 justify-center'}
                  ${active
                    ? 'bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30'
                    : 'bg-[#4A4B4D] text-gray-300 hover:bg-[#5A5B5D] hover:text-white'
                  }
                `}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
