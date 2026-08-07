import {
  Activity,
  BarChart3,
  BellRing,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Eye,
  Fuel,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
  Table2,
  Users,
  Map,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatOverlay from '../../shared/ChatOverlay'

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
      { path: '/setup/view', icon: Eye, label: 'View Setup' },
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
  {
    type: 'group',
    id: 'analysis',
    icon: Activity,
    label: 'Analysis',
    children: [
      { path: '/analysis', search: '?view=chart', defaultActive: true, icon: BarChart3, label: 'Chart' },
      { path: '/analysis', search: '?view=table', icon: Table2, label: 'Table' },
    ],
  },
]

const isPathActive = (pathname, path) => pathname === path
const isChildPathActive = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`)
const buildNavTarget = (item) => `${item.path}${item.search || ''}`
const isNavChildActive = (location, child) => {
  if (child.matchPaths?.some((path) => isChildPathActive(location.pathname, path))) return true
  if (!isChildPathActive(location.pathname, child.path)) return false
  if (!child.search) return true
  return location.search === child.search || (child.defaultActive && !location.search)
}

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
        .filter((item) => item.children.some((child) => isNavChildActive(location, child)))
        .map((item) => item.id),
    [location]
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
    <div className="self-stretch min-h-0 flex flex-col px-3 py-5">
      <div
        className={`
          flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/6 bg-[#343538] shadow-[0_24px_60px_rgba(0,0,0,0.22)]
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-72 px-4 py-4' : 'w-[78px] px-2 py-4 items-center'}
        `}
      >
        <button
          className={`
            mb-5 h-10 w-10 rounded-xl bg-white/6 text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white
            ${isSidebarOpen ? 'self-end' : 'self-center'}
          `}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${isSidebarOpen ? 'pr-1' : 'w-full'}`}>
          <nav className={`flex flex-col gap-2.5 ${isSidebarOpen ? '' : 'w-full items-center'}`}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon

              if (item.type === 'link') {
                const active = isPathActive(location.pathname, item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                    flex items-center gap-3 rounded-2xl text-[15px] font-medium tracking-[0.01em] transition-all duration-200
                    ${isSidebarOpen ? 'px-4 py-3.5' : 'h-12 w-12 justify-center'}
                    ${active
                      ? 'bg-[#74CD25] text-white shadow-[0_16px_28px_rgba(116,205,37,0.22)]'
                      : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'}
                  `}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                )
              }

              const groupActive = item.children.some((child) => isNavChildActive(location, child))

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
                    flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium tracking-[0.01em] transition-all duration-200
                    ${groupActive ? 'bg-[#74CD25] text-white shadow-[0_14px_24px_rgba(116,205,37,0.18)]' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'}
                    ${!isSidebarOpen ? 'mx-auto h-12 w-12 justify-center px-0' : ''}
                  `}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
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
                        const childActive = isNavChildActive(location, child)

                        return (
                          <button
                            key={buildNavTarget(child)}
                            onClick={() => navigate(buildNavTarget(child))}
                            className={`
                            flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-[0.01em] transition-all duration-200
                            ${childActive
                              ? 'bg-[#74CD25]/20 text-[#A6F268] border border-[#74CD25]/50'
                              : 'border border-transparent text-gray-300 hover:bg-white/[0.06] hover:text-white'}
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

        <ChatOverlay isSidebarOpen={isSidebarOpen} />
      </div>
    </div>
  )
}
