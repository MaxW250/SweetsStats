'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Overview', href: '/overview', icon: '📊' },
  { name: 'Sessions', href: '/sessions', icon: '📝' },
  { name: 'Earnings', href: '/earnings', icon: '💰' },
  { name: 'Tippers', href: '/tippers', icon: '❤️' },
  { name: 'Growth', href: '/growth', icon: '📈' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-40">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-coral' : 'text-gray-600'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
