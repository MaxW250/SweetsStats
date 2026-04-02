'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatUSD, formatDate } from '@/lib/utils'
import type { DailyEarning, StreamSession } from '@/types'
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
import { TrendingUp, Star, Calendar, Activity, Clock } from 'lucide-react'

type Timeframe = 'daily' | 'weekly' | 'monthly'

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: '8px',
    fontSize: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
}

function StatCard({
  label, value, sub, icon: Icon, color = '#2563EB', bg = '#EFF6FF',
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color?: string; bg?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={18} style={{ color }} strokeWidth={2} />
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<DailyEarning[]>([])
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<Timeframe>('daily')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    Promise.all([
      fetch('/api/daily-earnings').then((r) => r.json()),
      fetch('/api/sessions').then((r) => r.json()),
    ])
      .then(([earningsData, sessionsData]) => {
        setEarnings(earningsData)
        setSessions(Array.isArray(sessionsData) ? sessionsData : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter earnings by date range
  const filtered = useMemo(
    () => earnings.filter((e) => e.earnings_date >= startDate && e.earnings_date <= endDate),
    [earnings, startDate, endDate]
  )

  // Filter sessions to same date range
  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.session_date >= startDate && s.session_date <= endDate),
    [sessions, startDate, endDate]
  )

  // Build chart data based on timeframe
  const chartData = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.earnings_date.localeCompare(b.earnings_date))

    if (timeframe === 'daily') {
      return sorted.map((e) => ({ label: e.earnings_date.slice(5), usd: e.total_usd }))
    }

    if (timeframe === 'weekly') {
      const weeks: Record<string, number> = {}
      sorted.forEach((e) => {
        const d = new Date(e.earnings_date + 'T12:00:00')
        const day = d.getDay() || 7
        d.setDate(d.getDate() - day + 1)
        const key = d.toISOString().slice(0, 10)
        weeks[key] = (weeks[key] ?? 0) + e.total_usd
      })
      return Object.entries(weeks).map(([w, usd]) => ({ label: w.slice(5), usd }))
    }

    // monthly
    const months: Record<string, number> = {}
    sorted.forEach((e) => {
      const key = e.earnings_date.slice(0, 7)
      months[key] = (months[key] ?? 0) + e.total_usd
    })
    return Object.entries(months).map(([m, usd]) => ({ label: m.slice(5), usd }))
  }, [filtered, timeframe])

  // Stats
  const totalUSD = filtered.reduce((s, e) => s + e.total_usd, 0)
  const avgPerDay = filtered.length > 0 ? totalUSD / filtered.length : 0
  const bestDay = filtered.length > 0
    ? filtered.reduce((m, e) => (e.total_usd > m.total_usd ? e : m))
    : null

  // True hourly rate
  const totalStreamMins = filteredSessions.reduce((s, sess) => s + (sess.stream_length_minutes ?? 0), 0)
  const totalPrepMins = filteredSessions.reduce((s, sess) => s + ((sess as any).prep_time_minutes ?? 0), 0)
  const hasPrepData = totalPrepMins > 0
  const totalMins = totalStreamMins + totalPrepMins
  const hourlyRate = totalMins > 0 ? (totalUSD / totalMins) * 60 : null

  const setLast = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    setEndDate(end.toISOString().slice(0, 10))
    setStartDate(start.toISOString().slice(0, 10))
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your revenue over time</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <span className="text-gray-400 text-sm mt-5">—</span>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: 'All', days: 9999 }].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => days === 9999 ? (setStartDate('2020-01-01'), setEndDate(new Date().toISOString().slice(0, 10))) : setLast(days)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Earned" value={formatUSD(totalUSD)} icon={TrendingUp} />
        <StatCard
          label="Best Day"
          value={bestDay ? formatUSD(bestDay.total_usd) : '—'}
          sub={bestDay ? formatDate(bestDay.earnings_date) : undefined}
          icon={Star} color="#F59E0B" bg="#FFFBEB"
        />
        <StatCard
          label="Avg per Day"
          value={formatUSD(avgPerDay)}
          sub="stream days only"
          icon={Activity} color="#10B981" bg="#ECFDF5"
        />
        <StatCard
          label="Stream Days"
          value={filtered.length.toString()}
          icon={Calendar} color="#3B82F6" bg="#EFF6FF"
        />
        <StatCard
          label="True Hourly Rate"
          value={hourlyRate !== null ? formatUSD(hourlyRate) + '/hr' : '—'}
          sub={hourlyRate !== null ? (hasPrepData ? 'Including prep time' : 'Stream time only') : 'No session data'}
          icon={Clock} color="#8B5CF6" bg="#F5F3FF"
        />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 capitalize">{timeframe} Earnings</h3>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                stroke="#D1D5DB"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0}
              />
              <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [formatUSD(v as number), 'USD']} />
              <Bar dataKey="usd" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cumulative line */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cumulative Earnings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData.reduce<{ label: string; total: number }[]>((acc, item) => {
                const prev = acc[acc.length - 1]?.total ?? 0
                acc.push({ label: item.label, total: prev + item.usd })
                return acc
              }, [])}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                stroke="#D1D5DB"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                interval={chartData.length > 20 ? Math.floor(chartData.length / 8) : 0}
              />
              <YAxis stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [formatUSD(v as number), 'Total']} />
              <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Earnings Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">USD</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"># Tips</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Streams</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Tipper</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">No data for this range</td></tr>
              ) : (
                [...filtered]
                  .sort((a, b) => b.earnings_date.localeCompare(a.earnings_date))
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-700">{formatDate(e.earnings_date)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{formatUSD(e.total_usd)}</td>
                      <td className="px-5 py-3 text-gray-600">{e.total_tokens?.toLocaleString() ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{e.number_of_streams ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {e.highest_tipper_username
                          ? <span>{e.highest_tipper_username}{e.highest_tip_usd != null && <span className="text-gray-400 ml-1">({formatUSD(e.highest_tip_usd)})</span>}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
