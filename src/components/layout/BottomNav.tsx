'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Video,
  DollarSign,
  Heart,
  Upload,
} from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: Video },
  { name: 'Earnings', href: '/earnings', icon: DollarSign },
  { name: 'Tippers', href: '/tippers', icon: Heart },
  { name: 'Import', href: '/import', icon: Upload },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-1 pb-safe z-40">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-3 px-3 gap-1 text-[10px] font-medium transition-colors min-w-0 ${
              isActive ? 'text-coral' : 'text-gray-400'
            }`}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.75}
              className={isActive ? 'text-coral' : 'text-gray-400'}
            />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
