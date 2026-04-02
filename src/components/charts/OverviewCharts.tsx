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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

function chartStyle() {
  return {
    contentStyle: {
      backgroundColor: '#fff',
      border: '1px solid #F3F4F6',
      borderRadius: '8px',
      fontSize: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    labelStyle: { color: '#6B7280', fontSize: 11 },
  }
}

export function OverviewCharts({ sessions, earnings }: OverviewChartsProps) {
  // --- Monthly earnings (last 12 months) ---
  const monthlyData = getLast12Months().map((month) => {
    const total = earnings
      .filter((e) => e.earnings_date.startsWith(month))
      .reduce((sum, e) => sum + e.total_usd, 0)
    return { month: month.slice(5), earnings: total }
  })

  // --- Daily earnings last 30 days ---
  const today = new Date()
  const dailyEarnings30: { date: string; label: string; usd: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const usd = earnings.find((e) => e.earnings_date === dateStr)?.total_usd ?? 0
    dailyEarnings30.push({ date: dateStr, label: dateStr.slice(5), usd })
  }

  // --- Viewer growth (last 30 sessions sorted chronologically) ---
  const viewerData = sessions
    .slice()
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(-30)
    .map((s) => ({
      date: s.session_date.slice(5),
      avgViewers: s.avg_viewers ?? 0,
      peakViewers: s.most_viewers ?? 0,
    }))

  // --- Streaming times heatmap (day-of-week × hour-of-day) ---
  // Build a 7x12 grid counting how many streams started in that slot
  const heatGrid: Record<string, number> = {}
  sessions.forEach((s) => {
    if (!s.start_time) return
    const rawDay = new Date(s.session_date + 'T12:00:00').getDay() // 0=Sun
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][rawDay]
    const hour = parseInt(s.start_time.split(':')[0]) ?? 0
    const bucket = Math.floor(hour / 2) * 2 // round down to nearest even hour
    const key = `${dayName}-${bucket}`
    heatGrid[key] = (heatGrid[key] ?? 0) + 1
  })
  const maxHeat = Math.max(...Object.values(heatGrid), 1)

  const getHeatColor = (count: number) => {
    if (count === 0) return '#F3F4F6'
    const t = count / maxHeat
    if (t < 0.25) return '#FCDDD9'
    if (t < 0.5) return '#FAB4AD'
    if (t < 0.75) return '#F88F84'
    return '#2563EB'
  }

  // --- Earnings by day of week ---
  const dayEarnings: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
  }
  earnings.forEach((e) => {
    const rawDay = getDayOfWeek(e.earnings_date) // full day name
    const short = rawDay.slice(0, 3) as keyof typeof dayEarnings
    if (short in dayEarnings) dayEarnings[short] += e.total_usd
  })
  const dayOfWeekChart = DAYS.map((d) => ({ day: d, earnings: dayEarnings[d] ?? 0 }))

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly + Daily 30 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Earnings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                {...chartStyle()}
                formatter={(v) => [formatUSD(v as number), 'Earnings']}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#2563EB' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Earnings — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyEarnings30} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                stroke="#D1D5DB"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                interval={4}
              />
              <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                {...chartStyle()}
                formatter={(v) => [formatUSD(v as number), 'Earnings']}
              />
              <Bar dataKey="usd" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Viewer growth + Day of week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Viewer Growth — Last 30 Sessions</h3>
          {viewerData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              No session data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={viewerData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" stroke="#D1D5DB" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={4} />
                <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip {...chartStyle()} />
                <Line
                  type="monotone"
                  dataKey="avgViewers"
                  name="Avg Viewers"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="peakViewers"
                  name="Peak Viewers"
                  stroke="#FCD5D0"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Earnings by Day of Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayOfWeekChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                {...chartStyle()}
                formatter={(v) => [formatUSD(v as number), 'Earnings']}
              />
              <Bar dataKey="earnings" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Streaming times heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Stream Start Times Heatmap</h3>
          <p className="text-xs text-gray-400">When you typically go live</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Hour labels */}
            <div className="flex items-center mb-1 ml-8">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[10px] text-gray-400">
                  {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                </div>
              ))}
            </div>
            {/* Day rows */}
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-gray-400 w-7 shrink-0 text-right">{day}</span>
                <div className="flex flex-1 gap-1">
                  {HOURS.map((h) => {
                    const count = heatGrid[`${day}-${h}`] ?? 0
                    return (
                      <div
                        key={h}
                        className="flex-1 rounded-sm"
                        style={{
                          aspectRatio: '1.4',
                          backgroundColor: getHeatColor(count),
                        }}
                        title={`${day} ${h}:00 — ${count} stream${count !== 1 ? 's' : ''}`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-8">
              <span className="text-[10px] text-gray-400">Less</span>
              {['#F3F4F6', '#FCDDD9', '#FAB4AD', '#F88F84', '#2563EB'].map((c) => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
              ))}
              <span className="text-[10px] text-gray-400">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
