import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChartColumn,
  Clock,
  Database,
  Eye,
  Fuel,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
  Users,
  Map,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { type: 'link', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  {
    type: 'group',
    id: 'setup',
    icon: Settings2,
    label: 'Setup',
    children: [
      { path: '/setup/user-management', icon: Users, label: 'User Management' },
      { path: '/setup/sensor-calibration', icon: Fuel, label: 'Sensor Calibration' },
    ],
  },
  {
    type: 'group',
    id: 'parameter',
    icon: SlidersHorizontal,
    label: 'Parameter',
    children: [
      {
        path: '/parameter/entry',
        icon: Database,
        label: 'Entry Parameter',
        matchPaths: [
          '/parameter/equipment',
          '/parameter/location',
          '/parameter/operator',
          '/parameter/shift-code',
          '/parameter/material-type',
        ],
      },
      { path: '/parameter/view', icon: Eye, label: 'View Parameter' },
    ],
  },
  {
    type: 'group',
    id: 'datalog',
    icon: Clock,
    label: 'Data',
    children: [
      { path: '/history', icon: Database, label: 'Data Log' },
      { path: '/data-trip', icon: Map, label: 'Data Trip' },
    ],
  },
  { type: 'link', path: '/analysis', icon: BarChart3, label: 'Analysis' },
  { type: 'link', path: '/statistics', icon: ChartColumn, label: 'Statistik & Chart' },
]

const isPathActive = (pathname, path) => pathname === path
const isChildActive = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`)
const isNavChildActive = (pathname, child) =>
  isChildActive(pathname, child.path) || child.matchPaths?.some((path) => isChildActive(pathname, path))

export default function SideBar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved === 'true'
  })
  const location = useLocation()
  const navigate = useNavigate()

  const activeGroups = useMemo(
    () =>
      NAV_ITEMS.filter((item) => item.type === 'group')
        .filter((item) => item.children.some((child) => isNavChildActive(location.pathname, child)))
        .map((item) => item.id),
    [location.pathname]
  )

  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(activeGroups.map((id) => [id, true])))

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen)
  }, [isSidebarOpen])

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      activeGroups.forEach((id) => {
        next[id] = true
      })
      return next
    })
  }, [activeGroups])

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="self-stretch flex flex-col py-6 px-3">
      <div
        className={`
          bg-[#343538] rounded-2xl shadow-xl flex flex-col flex-1
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-72 px-4 py-5' : 'w-[76px] px-2 py-5 items-center'}
        `}
      >
        <button
          className={`
            p-2 rounded-xl bg-[#4A4B4D] text-gray-300 hover:bg-[#5A5B5D] hover:text-white
            transition-all duration-200 mb-6
            ${isSidebarOpen ? 'self-end' : 'self-center'}
          `}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <nav className={`flex flex-col gap-3 ${isSidebarOpen ? '' : 'w-full items-center'}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon

            if (item.type === 'link') {
              const active = isPathActive(location.pathname, item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center gap-3 rounded-xl font-semibold transition-all duration-200
                    ${isSidebarOpen ? 'px-4 py-3' : 'h-14 w-14 justify-center'}
                    ${active
                      ? 'bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30'
                      : 'bg-[#4A4B4D] text-gray-300 hover:bg-[#5A5B5D] hover:text-white'}
                  `}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              )
            }

            const groupActive = item.children.some((child) => isNavChildActive(location.pathname, child))

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-[#2D2E32] ${isSidebarOpen ? 'p-2' : 'w-full bg-transparent p-0'}`}
              >
                <button
                  onClick={() => {
                    if (!isSidebarOpen) {
                      setIsSidebarOpen(true)
                    } else {
                      toggleGroup(item.id)
                    }
                  }}
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-3 font-semibold transition-all duration-200
                    ${groupActive ? 'bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/20' : 'text-gray-300 hover:bg-[#4A4B4D] hover:text-white'}
                    ${!isSidebarOpen ? 'mx-auto h-14 w-14 justify-center px-0' : ''}
                  `}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openGroups[item.id] ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {isSidebarOpen && openGroups[item.id] && (
                  <div className="mt-2 flex flex-col gap-2 pl-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const childActive = isNavChildActive(location.pathname, child)

                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`
                            flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                            ${childActive
                              ? 'bg-[#74CD25]/20 text-[#A6F268] border border-[#74CD25]/50'
                              : 'text-gray-300 hover:bg-[#4A4B4D] hover:text-white border border-transparent'}
                          `}
                        >
                          <ChildIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
