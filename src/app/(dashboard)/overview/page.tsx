export const dynamic = 'force-dynamic'

import { supabaseServer } from '@/lib/supabase-server'
import { OverviewCharts } from '@/components/charts/OverviewCharts'
import { formatUSD, formatMinutes, formatDate, getLast12Months } from '@/lib/utils'
import type { StreamSession, DailyEarning } from '@/types'
import { TrendingUp, DollarSign, Video, Users, Star, Clock } from 'lucide-react'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = '#F97B6B',
  iconBg = '#FFF0EE',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconColor?: string
  iconBg?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} strokeWidth={2} />
      </div>
    </div>
  )
}

export default async function OverviewPage() {
  const [sessionsResponse, earningsResponse] = await Promise.all([
    supabaseServer.from('stream_sessions').select('*').order('session_date', { ascending: false }),
    supabaseServer.from('daily_earnings').select('*').order('earnings_date', { ascending: false }),
  ])

  const sessions = (sessionsResponse.data || []) as StreamSession[]
  const earnings = (earningsResponse.data || []) as DailyEarning[]

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEarnings = earnings.filter((e) => e.earnings_date.startsWith(currentMonth))
  const allTimeUSD = earnings.reduce((sum, e) => sum + e.total_usd, 0)
  const thisMonthUSD = thisMonthEarnings.reduce((sum, e) => sum + e.total_usd, 0)

  const totalMinutes = sessions.reduce((sum, s) => sum + s.stream_length_minutes, 0)
  const avgViewersAllTime =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.avg_viewers * s.stream_length_minutes, 0) /
            Math.max(totalMinutes, 1)
        )
      : 0

  const bestRankAllTime = sessions.length > 0 ? Math.min(...sessions.map((s) => s.best_rank)) : 0
  const bestDayAllTime = earnings.length > 0
    ? earnings.reduce((max, e) => (e.total_usd > max.total_usd ? e : max))
    : null

  // Last 30 days sessions for the "recent" section
  const recent7Sessions = sessions.slice(0, 7)
  const recent7Earnings = recent7Sessions.length > 0
    ? recent7Sessions.reduce((sum, s) => sum + s.total_usd_session, 0)
    : 0

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your streaming analytics at a glance</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="All Time"
          value={formatUSD(allTimeUSD)}
          icon={DollarSign}
          iconColor="#F97B6B"
          iconBg="#FFF0EE"
        />
        <StatCard
          label="This Month"
          value={formatUSD(thisMonthUSD)}
          sub={`${thisMonthEarnings.length} stream days`}
          icon={TrendingUp}
          iconColor="#10B981"
          iconBg="#ECFDF5"
        />
        <StatCard
          label="Best Day"
          value={bestDayAllTime ? formatUSD(bestDayAllTime.total_usd) : '—'}
          sub={bestDayAllTime ? formatDate(bestDayAllTime.earnings_date) : undefined}
          icon={Star}
          iconColor="#F59E0B"
          iconBg="#FFFBEB"
        />
        <StatCard
          label="Total Sessions"
          value={sessions.length.toString()}
          sub={`${formatMinutes(totalMinutes)} streamed`}
          icon={Video}
          iconColor="#8B5CF6"
          iconBg="#F5F3FF"
        />
        <StatCard
          label="Avg Viewers"
          value={avgViewersAllTime.toLocaleString()}
          icon={Users}
          iconColor="#3B82F6"
          iconBg="#EFF6FF"
        />
        <StatCard
          label="Best Rank"
          value={bestRankAllTime > 0 ? `#${bestRankAllTime.toLocaleString()}` : '—'}
          sub="all time"
          icon={Clock}
          iconColor="#6366F1"
          iconBg="#EEF2FF"
        />
      </div>

      {/* Charts */}
      <OverviewCharts sessions={sessions} earnings={earnings} />
    </div>
  )
}
