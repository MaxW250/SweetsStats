export const dynamic = 'force-dynamic'

import { supabaseServer } from '@/lib/supabase-server'
import { ExternalLink, Brain, Calendar, Clock, TrendingUp, Coffee, Sparkles, Activity } from 'lucide-react'

// Helper: sparkline path from array of numbers
function sparklinePath(values: number[], w = 120, h = 32): string {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  return 'M' + pts.join(' L')
}

function varianceScore(values: number[]): 'Low' | 'Medium' | 'High' {
  if (values.length < 2) return 'Low'
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sd = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length)
  const cv = mean > 0 ? sd / mean : 0
  return cv < 0.25 ? 'Low' : cv < 0.5 ? 'Medium' : 'High'
}

export default async function IntelligencePage() {
  const [sessionsRes, earningsRes, ofRes] = await Promise.all([
    supabaseServer.from('stream_sessions').select('*').order('session_date', { ascending: false }),
    supabaseServer.from('daily_earnings').select('*').order('earnings_date', { ascending: false }),
    supabaseServer.from('onlyfans_data').select('*').order('entry_date', { ascending: false }),
  ])

  const sessions = sessionsRes.data ?? []
  const earnings = earningsRes.data ?? []
  const ofData = ofRes.data ?? []

  // --- Winning formula ---
  // Best day of week by avg USD
  const byDow: Record<string, number[]> = {}
  sessions.forEach((s: any) => {
    if (!s.total_usd_session) return
    const dow = new Date(s.session_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    if (!byDow[dow]) byDow[dow] = []
    byDow[dow].push(s.total_usd_session)
  })
  const dowAvg = Object.entries(byDow).map(([day, vals]) => ({
    day, avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length,
  })).sort((a, b) => b.avg - a.avg)
  const bestDow = dowAvg[0]

  // Best start time window
  const byTime: Record<string, number[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] }
  sessions.forEach((s: any) => {
    if (!s.start_time || !s.total_usd_session) return
    const h = parseInt(s.start_time.split(':')[0])
    const bucket = h >= 6 && h < 12 ? 'Morning' : h >= 12 && h < 18 ? 'Afternoon' : h >= 18 && h < 22 ? 'Evening' : 'Night'
    byTime[bucket].push(s.total_usd_session)
  })
  const timeAvgs = Object.entries(byTime)
    .filter(([, v]) => v.length >= 2)
    .map(([t, v]) => ({ t, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.avg - a.avg)
  const bestTime = timeAvgs[0]

  // Optimal length bucket
  const byLength: Record<string, number[]> = { '1-2h': [], '2-3h': [], '3-4h': [], '4h+': [] }
  sessions.forEach((s: any) => {
    if (!s.stream_length_minutes || !s.total_usd_session) return
    const h = s.stream_length_minutes / 60
    const bucket = h < 2 ? '1-2h' : h < 3 ? '2-3h' : h < 4 ? '3-4h' : '4h+'
    const rate = (s.total_usd_session / s.stream_length_minutes) * 60
    byLength[bucket].push(rate)
  })
  const lengthAvgs = Object.entries(byLength)
    .filter(([, v]) => v.length >= 2)
    .map(([l, v]) => ({ l, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.avg - a.avg)
  const bestLength = lengthAvgs[0]

  // --- Cheapest day off ---
  const cheapestDow = dowAvg.length > 0 ? [...dowAvg].sort((a, b) => a.avg - b.avg)[0] : null

  // --- Burnout index ---
  const now = new Date()
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(now.getDate() - 28)
  const thisWeekMins = sessions
    .filter((s: any) => new Date(s.session_date) >= oneWeekAgo)
    .reduce((a: number, s: any) => a + (s.stream_length_minutes ?? 0), 0)
  const prevSessions = sessions.filter((s: any) => {
    const d = new Date(s.session_date)
    return d >= fourWeeksAgo && d < oneWeekAgo
  })
  const prevWeekAvgMins = prevSessions.length > 0
    ? prevSessions.reduce((a: number, s: any) => a + (s.stream_length_minutes ?? 0), 0) / 3
    : 0
  const burnoutRatio = prevWeekAvgMins > 0 ? thisWeekMins / prevWeekAvgMins : 1
  const burnoutStatus = burnoutRatio > 1.4 ? 'High' : burnoutRatio > 1.1 ? 'Medium' : 'Low'
  const burnoutColor = burnoutStatus === 'High' ? 'text-red-500 bg-red-50' : burnoutStatus === 'Medium' ? 'text-amber-500 bg-amber-50' : 'text-green-600 bg-green-50'

  // --- Income stability ---
  const last12Weeks: number[] = []
  for (let w = 11; w >= 0; w--) {
    const wStart = new Date(now); wStart.setDate(now.getDate() - (w + 1) * 7)
    const wEnd = new Date(now); wEnd.setDate(now.getDate() - w * 7)
    const wStr = wStart.toISOString().split('T')[0]
    const wEndStr = wEnd.toISOString().split('T')[0]
    const weekEarnings = earnings
      .filter((e: any) => e.earnings_date >= wStr && e.earnings_date < wEndStr)
      .reduce((a: number, e: any) => a + (e.total_usd ?? 0), 0)
    last12Weeks.push(weekEarnings)
  }
  const stability = varianceScore(last12Weeks)
  const stabilityColor = stability === 'Low' ? 'text-green-600 bg-green-50' : stability === 'Medium' ? 'text-amber-500 bg-amber-50' : 'text-red-500 bg-red-50'
  const sparkPath = sparklinePath(last12Weeks)

  // --- OF stream boost ---
  const ofStream = ofData.filter((e: any) => e.streamed_that_day)
  const ofNoStream = ofData.filter((e: any) => !e.streamed_that_day)
  const ofStreamAvg = ofStream.length ? ofStream.reduce((a: number, e: any) => a + e.new_subs, 0) / ofStream.length : null
  const ofNoStreamAvg = ofNoStream.length ? ofNoStream.reduce((a: number, e: any) => a + e.new_subs, 0) / ofNoStream.length : null
  const ofBoostPct = ofStreamAvg !== null && ofNoStreamAvg !== null && ofNoStreamAvg > 0
    ? Math.round(((ofStreamAvg - ofNoStreamAvg) / ofNoStreamAvg) * 100) : null

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Intelligence</h1>
        <p className="text-sm text-gray-400 mt-0.5">Insights calculated from your real data</p>
      </div>

      {/* Winning formula */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-brand" />
          <h2 className="text-sm font-semibold text-gray-700">Your winning formula</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard
            icon={<Calendar size={16} className="text-brand" />}
            label="Best day of week"
            value={bestDow ? bestDow.day : 'Not enough data'}
            sub={bestDow ? `avg $${bestDow.avg.toFixed(2)} · ${bestDow.count} sessions` : undefined}
            bg="bg-blue-50"
          />
          <InsightCard
            icon={<Clock size={16} className="text-amber-500" />}
            label="Best start window"
            value={bestTime ? bestTime.t : 'Not enough data'}
            sub={bestTime ? `avg $${bestTime.avg.toFixed(2)}` : undefined}
            bg="bg-amber-50"
          />
          <InsightCard
            icon={<TrendingUp size={16} className="text-green-500" />}
            label="Optimal length"
            value={bestLength ? bestLength.l : 'Not enough data'}
            sub={bestLength ? `$${bestLength.avg.toFixed(2)}/hr avg` : undefined}
            bg="bg-green-50"
          />
        </div>
      </section>

      {/* OF boost + cheapest day off */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ofBoostPct !== null ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={15} className="text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-700">Subs vs streams</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{ofBoostPct >= 0 ? '+' : ''}{ofBoostPct}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {ofBoostPct >= 0
                ? `You get ${ofBoostPct}% more OF subs on stream days`
                : `${Math.abs(ofBoostPct)}% fewer OF subs on stream days`}
            </p>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span>Stream days: <strong className="text-gray-700">{ofStreamAvg?.toFixed(1)} avg</strong></span>
              <span>Off days: <strong className="text-gray-700">{ofNoStreamAvg?.toFixed(1)} avg</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={15} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-500">Subs vs streams</h3>
            </div>
            <p className="text-sm text-gray-400">Add OnlyFans data to see stream impact.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coffee size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">Best rest day</h3>
          </div>
          {cheapestDow ? (
            <>
              <p className="text-2xl font-bold text-gray-900">{cheapestDow.day}</p>
              <p className="text-sm text-gray-500 mt-1">
                Taking {cheapestDow.day}s off costs avg ${cheapestDow.avg.toFixed(2)} — the cheapest day off
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Not enough session data yet.</p>
          )}
        </div>
      </div>

      {/* Burnout + stability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={15} className="text-red-400" />
            <h3 className="text-sm font-semibold text-gray-700">Burnout index</h3>
          </div>
          <div className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${burnoutColor}`}>
            {burnoutStatus}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {thisWeekMins > 0
              ? `${Math.round(thisWeekMins / 60)}h this week vs ${Math.round(prevWeekAvgMins / 60)}h weekly avg`
              : 'No streams logged this week'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-brand" />
            <h3 className="text-sm font-semibold text-gray-700">Income stability</h3>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className={`inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-xl ${stabilityColor}`}>
                {stability}
              </div>
              <p className="text-xs text-gray-400 mt-2">variance score · last 12 weeks</p>
            </div>
            {sparkPath && (
              <svg width={120} height={32} className="shrink-0">
                <path d={sparkPath} fill="none" stroke="#2563EB" strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* External links */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink size={15} className="text-brand" />
          <h2 className="text-sm font-semibold text-gray-700">External stats</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="https://plus.statbate.com/room/chaturbate/xkaylasweet" target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-brand/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">Statbate stats</p>
              <p className="text-xs text-gray-400 truncate">plus.statbate.com · xkaylasweet</p>
            </div>
            <ExternalLink size={13} className="text-gray-300 shrink-0 ml-auto group-hover:text-brand transition-colors" />
          </a>
          <a href="https://www.cbhours.com/user/xkaylasweet.html" target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-brand/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">CBHours stats</p>
              <p className="text-xs text-gray-400 truncate">cbhours.com · xkaylasweet</p>
            </div>
            <ExternalLink size={13} className="text-gray-300 shrink-0 ml-auto group-hover:text-brand transition-colors" />
          </a>
        </div>
      </section>
    </div>
  )
}

function InsightCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
