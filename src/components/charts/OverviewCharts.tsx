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
  ResponsiveContainer,
} from 'recharts'
import type { StreamSession, DailyEarning } from '@/types'
import { getLast12Months, getDayOfWeek, formatUSD } from '@/lib/utils'

interface OverviewChartsProps {
  sessions: StreamSession[]
  earnings: DailyEarning[]
}

export function OverviewCharts({ sessions, earnings }: OverviewChartsProps) {
  const monthlyData = getLast12Months().map((month) => {
    const monthEarnings = earnings.filter((e) =>
      e.earnings_date.startsWith(month)
    )
    const total = monthEarnings.reduce((sum, e) => sum + e.total_usd, 0)
    return { month: month.slice(5), earnings: total }
  })

  const dayOfWeekData: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
    Thursday: 0, Friday: 0, Saturday: 0,
  }
  earnings.forEach((e) => {
    const day = getDayOfWeek(e.earnings_date)
    dayOfWeekData[day] += e.total_usd
  })
  const dayOfWeekChart = Object.entries(dayOfWeekData).map(([day, amount]) => ({
    day: day.slice(0, 3),
    earnings: amount,
  }))

  const viewerData = sessions
    .slice()
    .reverse()
    .slice(0, 30)
    .map((s) => ({
      date: s.session_date.slice(-5),
      avgViewers: s.avg_viewers,
    }))

  // Heatmap: last 12 weeks of earnings
  const today = new Date()
  const heatmapDays: { date: string; value: number }[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const earned = earnings.find((e) => e.earnings_date === dateStr)?.total_usd ?? 0
    heatmapDays.push({ date: dateStr, value: earned })
  }
  const maxEarning = Math.max(...heatmapDays.map((d) => d.value), 1)
  const getHeatColor = (value: number) => {
    if (value === 0) return '#F3F4F6'
    const intensity = value / maxEarning
    if (intensity < 0.25) return '#FED7D7'
    if (intensity < 0.5) return '#FC8181'
    if (intensity < 0.75) return '#F97B6B'
    return '#E53E3E'
  }

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
            <Line type="monotone" dataKey="earnings" stroke="#F97B6B" strokeWidth={2} dot={false} />
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
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }} />
            <Line type="monotone" dataKey="avgViewers" stroke="#F97B6B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
          Earnings Heatmap (Last 12 Weeks)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '4px',
          }}
        >
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${formatUSD(day.value)}`}
              style={{
                aspectRatio: '1',
                borderRadius: '3px',
                backgroundColor: getHeatColor(day.value),
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Less</span>
          {['#F3F4F6', '#FED7D7', '#FC8181', '#F97B6B', '#E53E3E'].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
