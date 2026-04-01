'use client'

import { useState, useEffect } from 'react'
import { formatUSD, formatDate, getDateRange } from '@/lib/utils'
import { StatCard } from '@/components/ui/StatCard'
import type { DailyEarning } from '@/types'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<DailyEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-earnings')
      const data = await response.json()
      setEarnings(data)
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEarnings = earnings.filter((e) => e.earnings_date.startsWith(currentMonth))

  const bestDay = thisMonthEarnings.length > 0
    ? thisMonthEarnings.reduce((max, e) => e.total_usd > max.total_usd ? e : max)
    : null

  const worstDay = thisMonthEarnings.length > 0
    ? thisMonthEarnings.reduce((min, e) => e.total_usd < min.total_usd ? e : min)
    : null

  const avgPerStreamDay = thisMonthEarnings.length > 0
    ? thisMonthEarnings.reduce((sum, e) => sum + e.total_usd, 0) / thisMonthEarnings.reduce((sum, e) => sum + e.number_of_streams, 0)
    : 0

  const thisMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const avgPerCalendarDay = thisMonthEarnings.length > 0
    ? thisMonthEarnings.reduce((sum, e) => sum + e.total_usd, 0) / thisMonthDays
    : 0

  const chartData = thisMonthEarnings
    .sort((a, b) => new Date(a.earnings_date).getTime() - new Date(b.earnings_date).getTime())
    .map((e) => ({
      date: e.earnings_date.slice(-2),
      earnings: e.total_usd,
    }))

  const topTippers = earnings
    .filter((e) => e.highest_tipper_username)
    .reduce((acc: Record<string, number>, e) => {
      acc[e.highest_tipper_username!] = (acc[e.highest_tipper_username!] || 0) + 1
      return acc
    }, {})

  const topTippersArray = Object.entries(topTippers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-2">Track your daily revenue</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTimeframe('daily')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'daily'
              ? 'bg-coral text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setTimeframe('weekly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'weekly'
              ? 'bg-coral text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimeframe('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'monthly'
              ? 'bg-coral text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bestDay && (
          <StatCard
            title="Best Day"
            value={formatUSD(bestDay.total_usd)}
            subtitle={formatDate(bestDay.earnings_date)}
            accent="bg-green-50"
          />
        )}
        {worstDay && (
          <StatCard
            title="Lowest Day"
            value={formatUSD(worstDay.total_usd)}
            subtitle={formatDate(worstDay.earnings_date)}
            accent="bg-gray-50"
          />
        )}
        <StatCard
          title="Avg per Stream"
          value={formatUSD(avgPerStreamDay)}
          accent="bg-gray-50"
        />
        <StatCard
          title="Avg per Calendar Day"
          value={formatUSD(avgPerCalendarDay)}
          accent="bg-gray-50"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Daily Earnings This Month
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
              formatter={(value) => formatUSD(value as number)}
            />
            <Bar dataKey="earnings" fill="#F97B6B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Top Tippers This Month
        </h3>
        <div className="space-y-3">
          {topTippersArray.length > 0 ? (
            topTippersArray.map(([username, count], idx) => (
              <div key={username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                  <span className="font-medium text-gray-900">{username}</span>
                </div>
                <span className="text-sm text-gray-600">{count} time{count !== 1 ? 's' : ''}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No tippers yet this month</p>
          )}
        </div>
      </div>
    </div>
  )
}
