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
import type { StreamSession, Goal } from '@/types'
import { getLast12Months } from '@/lib/utils'

interface GrowthChartsProps {
  sessions: StreamSession[]
  goals: Goal[]
}

export function GrowthCharts({ sessions, goals }: GrowthChartsProps) {
  const months = getLast12Months()

  // Followers per month
  const followerData = months.map((month) => {
    const monthSessions = sessions.filter((s) =>
      s.session_date.startsWith(month)
    )
    const totalFollowers = monthSessions.reduce((sum, s) => sum + (s.followers_gained || 0), 0)
    return {
      month: month.slice(5),
      followers: totalFollowers,
    }
  })

  // Avg viewers per month
  const viewerData = months.map((month) => {
    const monthSessions = sessions.filter((s) =>
      s.session_date.startsWith(month)
    )
    if (monthSessions.length === 0) return { month: month.slice(5), avgViewers: 0 }
    const avgViewers =
      monthSessions.reduce((sum, s) => sum + s.avg_viewers, 0) /
      monthSessions.length
    return {
      month: month.slice(5),
      avgViewers: Math.round(avgViewers),
    }
  })

  // Rank trend (inverted)
  const rankData = months.map((month) => {
    const monthSessions = sessions.filter((s) =>
      s.session_date.startsWith(month)
    )
    if (monthSessions.length === 0) return { month: month.slice(5), bestRank: 0 }
    const bestRank = Math.max(...monthSessions.map((s) => s.best_rank || 0))
    return {
      month: month.slice(5),
      bestRank,
    }
  })

  // Hours per month
  const hoursData = months.map((month) => {
    const monthSessions = sessions.filter((s) =>
      s.session_date.startsWith(month)
    )
    const totalMinutes = monthSessions.reduce((sum, s) => sum + s.stream_length_minutes, 0)
    return {
      month: month.slice(5),
      hours: Math.round(totalMinutes / 60),
    }
  })

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Followers Growth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={followerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
            />
            <Bar dataKey="followers" fill="#2563EB" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Average Viewers
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={viewerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
            />
            <Line
              type="monotone"
              dataKey="avgViewers"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ fill: '#2563EB', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Best Rank Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rankData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
            />
            <Line
              type="monotone"
              dataKey="bestRank"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ fill: '#2563EB', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
          Hours Streamed
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB' }}
            />
            <Bar dataKey="hours" fill="#2563EB" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {goals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-6">
            Goals Progress
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-gray-900">{goal.goal_type}</p>
                  <p className="text-sm text-gray-600">
                    {goal.current_value} / {goal.target_value}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
