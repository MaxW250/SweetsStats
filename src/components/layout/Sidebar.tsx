'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Video,
  DollarSign,
  Heart,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: Video },
  { name: 'Earnings', href: '/earnings', icon: DollarSign },
  { name: 'Tippers', href: '/tippers', icon: Heart },
  { name: 'Import', href: '/import', icon: Upload },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 min-h-[60px]">
        {!collapsed && (
          <h1 className="text-base font-bold text-gray-900 tracking-tight truncate">
            <span style={{ color: '#F97B6B' }}>Sweets</span>Stats
          </h1>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors ${collapsed ? 'mx-auto' : 'ml-auto'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
              style={isActive ? { backgroundColor: '#F97B6B' } : {}}
            >
              <Icon
                size={18}
                className={isActive ? 'text-white shrink-0' : 'text-gray-400 shrink-0'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === '/settings'
              ? 'text-white'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          } ${collapsed ? 'justify-center' : ''}`}
          style={pathname === '/settings' ? { backgroundColor: '#F97B6B' } : {}}
        >
          <Settings
            size={18}
            className={pathname === '/settings' ? 'text-white shrink-0' : 'text-gray-400 shrink-0'}
            strokeWidth={2}
          />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} className="text-gray-400 shrink-0" strokeWidth={2} />
          {!collapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  )
}
