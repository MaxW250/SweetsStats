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
} from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: Video },
  { name: 'Earnings', href: '/earnings', icon: DollarSign },
  { name: 'Tippers', href: '/tippers', icon: Heart },
  { name: 'Import', href: '/import', icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-xl font-serif font-bold text-gray-900 tracking-tight">
          <span className="text-coral">Sweets</span>Stats
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-coral/10 text-coral'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon
                size={18}
                className={isActive ? 'text-coral' : 'text-gray-400'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === '/settings'
              ? 'bg-coral/10 text-coral'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Settings
            size={18}
            className={pathname === '/settings' ? 'text-coral' : 'text-gray-400'}
            strokeWidth={2}
          />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all disabled:opacity-50"
        >
          <LogOut size={18} className="text-gray-400" strokeWidth={2} />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
