'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) setCollapsed(stored === 'true')
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-w-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
