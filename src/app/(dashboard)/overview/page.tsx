import { supabaseServer } from '@/lib/supabase-server'
import { StatCard } from '@/components/ui/StatCard'
import { OverviewCharts } from '@/components/charts/OverviewCharts'
import { formatUSD, formatMinutes, formatDate, getDateRange, getLast12Months } from '@/lib/utils'
import type { StreamSession, DailyEarning } from '@/types'

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

  const allTimeViewers = sessions.reduce((sum, s) => sum + s.avg_viewers * s.stream_length_minutes, 0)
  const avgViewersAllTime = sessions.length > 0 ? Math.round(allTimeViewers / sessions.reduce((sum, s) => sum + s.stream_length_minutes, 0)) : 0

  const bestRankAllTime = sessions.length > 0 ? Math.min(...sessions.map((s) => s.best_rank)) : 0
  const totalHours = sessions.reduce((sum, s) => sum + s.stream_length_minutes, 0)

  const bestDayAllTime = earnings.length > 0 ? earnings.reduce((max, e) => e.total_usd > max.total_usd ? e : max) : null
  const bestDayThisMonth = thisMonthEarnings.length > 0 ? thisMonthEarnings.reduce((max, e) => e.total_usd > max.total_usd ? e : max) : null
  const worstDayThisMonth = thisMonthEarnings.length > 0 ? thisMonthEarnings.reduce((min, e) => e.total_usd < min.total_usd ? e : min) : null

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600 mt-2">Your streaming analytics at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="All Time Earnings"
          value={formatUSD(allTimeUSD)}
          accent="bg-gradient-to-br from-coral from-10% to-white"
        />
        <StatCard
          title="This Month"
          value={formatUSD(thisMonthUSD)}
          accent="bg-gray-50"
        />
        <StatCard
          title="Avg Viewers"
          value={avgViewersAllTime.toLocaleString()}
          accent="bg-gray-50"
        />
        <StatCard
          title="Best Rank Ever"
          value={`#${bestRankAllTime.toLocaleString()}`}
          accent="bg-gray-50"
        />
        <StatCard
          title="Total Hours"
          value={formatMinutes(totalHours)}
          accent="bg-gray-50"
        />
        {bestDayAllTime && (
          <StatCard
            title="Best Day Ever"
            value={formatUSD(bestDayAllTime.total_usd)}
            subtitle={formatDate(bestDayAllTime.earnings_date)}
            accent="bg-gray-50"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bestDayThisMonth && (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200 p-6">
            <p className="text-sm text-green-700 font-medium">Best Day This Month</p>
            <p className="text-3xl font-serif font-bold text-green-900 mt-2">
              {formatUSD(bestDayThisMonth.total_usd)}
            </p>
            <p className="text-sm text-green-700 mt-2">
              {formatDate(bestDayThisMonth.earnings_date)}
            </p>
          </div>
        )}

        {worstDayThisMonth && (
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-200 p-6">
            <p className="text-sm text-amber-700 font-medium">Take This Day Off Guilt-Free</p>
            <p className="text-3xl font-serif font-bold text-amber-900 mt-2">
              {formatUSD(worstDayThisMonth.total_usd)}
            </p>
            <p className="text-sm text-amber-700 mt-2">
              {formatDate(worstDayThisMonth.earnings_date)} 💛
            </p>
          </div>
        )}
      </div>

      <OverviewCharts sessions={sessions} earnings={earnings} />
    </div>
  )
}
