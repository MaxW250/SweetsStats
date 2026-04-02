export const dynamic = 'force-dynamic'

import { supabaseServer } from '@/lib/supabase-server'
import { OverviewCharts } from '@/components/charts/OverviewCharts'
import { formatUSD, formatMinutes, formatDate } from '@/lib/utils'
import type { StreamSession, DailyEarning } from '@/types'
import { TrendingUp, DollarSign, Video, Users, Star, Clock, Trophy, Coffee, Activity, Zap } from 'lucide-react'

function StatCard({
  label, value, sub, icon: Icon, iconColor = '#2563EB', iconBg = '#EFF6FF',
}: { label: string; value: string; sub?: string; icon: React.ElementType; iconColor?: string; iconBg?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} strokeWidth={2} />
      </div>
    </div>
  )
}

function InsightCard({
  label, value, sub, icon: Icon, iconColor = '#2563EB', iconBg = '#EFF6FF', badge, badgeColor,
}: { label: string; value: string; sub?: string; icon: React.ElementType; iconColor?: string; iconBg?: string; badge?: string; badgeColor?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: iconBg }}>
        <Icon size={15} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {badge && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ml-auto ${badgeColor ?? 'bg-green-50 text-green-600'}`}>{badge}</span>
      )}
    </div>
  )
}

export default async function OverviewPage() {
  const [sessionsRes, earningsRes, ofRes] = await Promise.all([
    supabaseServer.from('stream_sessions').select('*').order('session_date', { ascending: false }),
    supabaseServer.from('daily_earnings').select('*').order('earnings_date', { ascending: false }),
    supabaseServer.from('onlyfans_data').select('new_subs,streamed_that_day').order('entry_date', { ascending: false }),
  ])

  const sessions = (sessionsRes.data || []) as StreamSession[]
  const earnings = (earningsRes.data || []) as DailyEarning[]
  const ofData = ofRes.data || []

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEarnings = earnings.filter((e) => e.earnings_date.startsWith(currentMonth))
  const allTimeUSD = earnings.reduce((s, e) => s + e.total_usd, 0)
  const thisMonthUSD = thisMonthEarnings.reduce((s, e) => s + e.total_usd, 0)
  const totalMinutes = sessions.reduce((s, e) => s + e.stream_length_minutes, 0)
  const avgViewers = sessions.length > 0 ? Math.round(sessions.reduce((s, e) => s + e.avg_viewers * e.stream_length_minutes, 0) / Math.max(totalMinutes, 1)) : 0
  const bestRank = sessions.length > 0 ? Math.min(...sessions.map((s) => s.best_rank)) : 0
  const bestDayAllTime = earnings.length > 0 ? earnings.reduce((m, e) => (e.total_usd > m.total_usd ? e : m)) : null

  // --- Insight calculations ---
  // Best day of week
  const byDow: Record<string, number[]> = {}
  sessions.forEach((s) => {
    if (!s.total_usd_session) return
    const dow = new Date(s.session_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    if (!byDow[dow]) byDow[dow] = []
    byDow[dow].push(s.total_usd_session)
  })
  const dowAvg = Object.entries(byDow)
    .map(([day, vals]) => ({ day, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => b.avg - a.avg)
  const bestDow = dowAvg[0]
  const cheapestDow = dowAvg.length > 0 ? [...dowAvg].sort((a, b) => a.avg - b.avg)[0] : null

  // Best start window
  const byTime: Record<string, number[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] }
  sessions.forEach((s) => {
    if (!s.start_time || !s.total_usd_session) return
    const h = parseInt(s.start_time.split(':')[0])
    const b = h >= 6 && h < 12 ? 'Morning' : h >= 12 && h < 18 ? 'Afternoon' : h >= 18 && h < 22 ? 'Evening' : 'Night'
    byTime[b].push(s.total_usd_session)
  })
  const bestTimeEntry = Object.entries(byTime).filter(([, v]) => v.length >= 2)
    .map(([t, v]) => ({ t, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.avg - a.avg)[0]

  // Burnout index (this week vs 3-week avg)
  const now = new Date()
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(now.getDate() - 28)
  const thisWeekMins = sessions
    .filter((s) => new Date(s.session_date) >= oneWeekAgo)
    .reduce((a, s) => a + (s.stream_length_minutes ?? 0), 0)
  const prevWeekMins = sessions
    .filter((s) => { const d = new Date(s.session_date); return d >= fourWeeksAgo && d < oneWeekAgo })
    .reduce((a, s) => a + (s.stream_length_minutes ?? 0), 0) / 3
  const burnoutRatio = prevWeekMins > 0 ? thisWeekMins / prevWeekMins : 1
  const burnoutStatus = burnoutRatio > 1.4 ? 'High 🔴' : burnoutRatio > 1.1 ? 'Medium 🟡' : 'Low 🟢'
  const burnoutBg = burnoutRatio > 1.4 ? 'bg-red-50 text-red-600' : burnoutRatio > 1.1 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'

  // OF stream boost
  const ofStream = ofData.filter((e: any) => e.streamed_that_day)
  const ofNoStream = ofData.filter((e: any) => !e.streamed_that_day)
  const ofStreamAvg = ofStream.length >= 3 ? ofStream.reduce((a: number, e: any) => a + e.new_subs, 0) / ofStream.length : null
  const ofNoStreamAvg = ofNoStream.length >= 3 ? ofNoStream.reduce((a: number, e: any) => a + e.new_subs, 0) / ofNoStream.length : null
  const ofBoostPct = ofStreamAvg !== null && ofNoStreamAvg !== null && ofNoStreamAvg > 0
    ? Math.round(((ofStreamAvg - ofNoStreamAvg) / ofNoStreamAvg) * 100) : null

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your streaming analytics at a glance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="All Time" value={formatUSD(allTimeUSD)} icon={DollarSign} iconColor="#2563EB" iconBg="#EFF6FF" />
        <StatCard label="This Month" value={formatUSD(thisMonthUSD)} sub={`${thisMonthEarnings.length} stream days`} icon={TrendingUp} iconColor="#10B981" iconBg="#ECFDF5" />
        <StatCard label="Best Day" value={bestDayAllTime ? formatUSD(bestDayAllTime.total_usd) : '—'} sub={bestDayAllTime ? formatDate(bestDayAllTime.earnings_date) : undefined} icon={Star} iconColor="#F59E0B" iconBg="#FFFBEB" />
        <StatCard label="Total Sessions" value={sessions.length.toString()} sub={`${formatMinutes(totalMinutes)} streamed`} icon={Video} iconColor="#8B5CF6" iconBg="#F5F3FF" />
        <StatCard label="Avg Viewers" value={avgViewers.toLocaleString()} icon={Users} iconColor="#3B82F6" iconBg="#EFF6FF" />
        <StatCard label="Best Rank" value={bestRank > 0 ? `#${bestRank.toLocaleString()}` : '—'} sub="all time" icon={Clock} iconColor="#6366F1" iconBg="#EEF2FF" />
      </div>

      {/* Insight row */}
      {sessions.length >= 3 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Insights</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              label="Best day"
              value={bestDow ? `${bestDow.day}${bestTimeEntry ? ` ${bestTimeEntry.t.toLowerCase()}s` : ''}` : 'More data needed'}
              sub={bestDow ? `avg ${formatUSD(bestDow.avg)} · best time to stream` : undefined}
              icon={Trophy} iconColor="#F59E0B" iconBg="#FFFBEB"
            />
            <InsightCard
              label="Cheapest day off"
              value={cheapestDow ? cheapestDow.day : 'More data needed'}
              sub={cheapestDow ? `avg ${formatUSD(cheapestDow.avg)} missed — cheapest skip` : undefined}
              icon={Coffee} iconColor="#6B7280" iconBg="#F9FAFB"
            />
            {ofBoostPct !== null ? (
              <InsightCard
                label="OF stream boost"
                value={`${ofBoostPct >= 0 ? '+' : ''}${ofBoostPct}% subs`}
                sub="more OF subs on stream days"
                icon={Zap} iconColor="#8B5CF6" iconBg="#F5F3FF"
                badge={ofBoostPct >= 0 ? `+${ofBoostPct}%` : `${ofBoostPct}%`}
                badgeColor={ofBoostPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}
              />
            ) : (
              <InsightCard
                label="OF stream boost"
                value="Add OF data"
                sub="Log OnlyFans entries to see stream impact"
                icon={Zap} iconColor="#8B5CF6" iconBg="#F5F3FF"
              />
            )}
            <InsightCard
              label="Burnout check"
              value={`${Math.round(thisWeekMins / 60)}h this week`}
              sub={prevWeekMins > 0 ? `vs ${Math.round(prevWeekMins / 60)}h weekly avg` : 'Not enough history yet'}
              icon={Activity} iconColor="#EF4444" iconBg="#FEF2F2"
              badge={burnoutStatus}
              badgeColor={burnoutBg}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <OverviewCharts sessions={sessions} earnings={earnings} />
    </div>
  )
}
