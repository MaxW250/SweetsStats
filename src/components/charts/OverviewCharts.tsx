'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CalendarHeatmap,
} from 'recharts'
import type { StreamSession, DailyEarning } from '@/types'
import { getLast12Months, getDayOfWeek, formatUSD } from '@/lib/utils'

interface OverviewChartsProps {
  sessions: StreamSession[]
  earnings: DailyEarning[]
}

export function OverviewCharts({ sessions, earnings }: OverviewChartsProps) {
  // Monthly earnings chart
  const monthlyData = getLast12Months().map((month) => {
    const monthEarnings = earnings.filter((e) =>
      e.earnings_date.startsWith(month)
    )
    const total = monthEarnings.reduce((sum, e) => sum + e.total_usd, 0)
    return {
      month: month.slice(5),
      earnings: total,
    }
  })

  // Day of week earnings
  const dayOfWeekData: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  }

  earnings.forEach((e) => {
    const day = getDayOfWeek(e.earnings_date)
    dayOfWeekData[day] += e.total_usd
  })

  const dayOfWeekChart = Object.entries(dayOfWeekData).map(([day, amount]) => ({
    day: day.slice(0, 3),
    earnings: amount,
  }))

  // Viewer growth
  const viewerData = sessions
    .slice()
    .reverse()
    .slice(0, 30)
    .map((s) => ({
      date: s.session_date.slice(-5),
      avgViewers: s.avg_viewers,
    }))

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Monthly Earnings
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
              formatter={(value) => formatUSD(value as number)}
            />
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="#F97B6B"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Earnings by Day of Week
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayOfWeekChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
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
          Viewer Growth (Last 30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={viewerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
            />
            <Line
              type="monotone"
              dataKey="avgViewers"
              stroke="#F97B6B"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
