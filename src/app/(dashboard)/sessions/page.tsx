'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatUSD, formatMinutes } from '@/lib/utils'
import { SlideOver } from '@/components/ui/SlideOver'
import { SessionForm } from '@/components/forms/SessionForm'
import { Plus, TrendingDown, Trophy, DollarSign, Users } from 'lucide-react'
import type { StreamSession } from '@/types'

type DepthFilter = 'this-week' | 'last-week' | 'this-month' | 'all'

// Returns Mon–Sun of the current week as ISO date strings
function getThisWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
}

function getLastWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const thisMon = new Date(now)
  thisMon.setDate(now.getDate() - ((day + 6) % 7))
  const lastMon = new Date(thisMon)
  lastMon.setDate(thisMon.getDate() - 7)
  const lastSun = new Date(thisMon)
  lastSun.setDate(thisMon.getDate() - 1)
  return { start: lastMon.toISOString().split('T')[0], end: lastSun.toISOString().split('T')[0] }
}

function getThisMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: first.toISOString().split('T')[0], end: last.toISOString().split('T')[0] }
}

function computeStats(list: StreamSession[]) {
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => (b.total_usd_session ?? 0) - (a.total_usd_session ?? 0))
  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1],
    totalUSD: list.reduce((s, x) => s + (x.total_usd_session ?? 0), 0),
    totalMins: list.reduce((s, x) => s + (x.stream_length_minutes ?? 0), 0),
    avgViewers: Math.round(list.reduce((s, x) => s + (x.avg_viewers ?? 0), 0) / list.length),
    count: list.length,
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [depthFilter, setDepthFilter] = useState<DepthFilter>('this-month')

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try { setSessions(await (await fetch('/api/sessions')).json()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleAddSession = async () => { await fetchSessions(); setIsFormOpen(false) }

  const handleUpdateNotes = async (id: string, notes: string) => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    await fetchSessions()
    setExpandedId(null)
  }

  const { start: weekStart, end: weekEnd } = getThisWeekRange()
  const { start: lastWeekStart, end: lastWeekEnd } = getLastWeekRange()
  const { start: monthStart, end: monthEnd } = getThisMonthRange()

  const thisWeek = useMemo(() => sessions.filter((s) => s.session_date >= weekStart && s.session_date <= weekEnd), [sessions, weekStart, weekEnd])
  const lastWeek = useMemo(() => sessions.filter((s) => s.session_date >= lastWeekStart && s.session_date <= lastWeekEnd), [sessions, lastWeekStart, lastWeekEnd])
  const thisMonth = useMemo(() => sessions.filter((s) => s.session_date >= monthStart && s.session_date <= monthEnd), [sessions, monthStart, monthEnd])

  const ws = useMemo(() => computeStats(thisWeek), [thisWeek])
  const lws = useMemo(() => computeStats(lastWeek), [lastWeek])
  const ms = useMemo(() => computeStats(thisMonth), [thisMonth])

  // Filtered list for the session rows
  const filteredSessions = useMemo(() => {
    switch (depthFilter) {
      case 'this-week': return sessions.filter((s) => s.session_date >= weekStart && s.session_date <= weekEnd)
      case 'last-week': return sessions.filter((s) => s.session_date >= lastWeekStart && s.session_date <= lastWeekEnd)
      case 'this-month': return sessions.filter((s) => s.session_date >= monthStart && s.session_date <= monthEnd)
      default: return sessions
    }
  }, [sessions, depthFilter, weekStart, weekEnd, lastWeekStart, lastWeekEnd, monthStart, monthEnd])

  const sd = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const depthTabs: { key: DepthFilter; label: string; count: number }[] = [
    { key: 'this-week', label: 'This week', count: thisWeek.length },
    { key: 'last-week', label: 'Last week', count: lastWeek.length },
    { key: 'this-month', label: 'This month', count: thisMonth.length },
    { key: 'all', label: 'All', count: sessions.length },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {sessions.length} total &middot; {thisWeek.length} this week
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Add Session
        </button>
      </div>

      {/* This week summary */}
      {ws && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">This week</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniCard icon={<Trophy size={13} className="text-amber-400" />} label="Best day" value={sd(ws.best.session_date)} sub={formatUSD(ws.best.total_usd_session)} subColor="text-brand" />
            <MiniCard icon={<TrendingDown size={13} className="text-gray-300" />} label="Lowest day" value={sd(ws.worst.session_date)} sub={formatUSD(ws.worst.total_usd_session)} subColor="text-gray-400" />
            <MiniCard icon={<DollarSign size={13} className="text-green-400" />} label="Week total" value={formatUSD(ws.totalUSD)} sub={`${ws.count} sessions`} subColor="text-gray-400" />
            <MiniCard icon={<Users size={13} className="text-blue-400" />} label="Avg viewers" value={String(ws.avgViewers)} sub={formatMinutes(ws.totalMins) + ' streamed'} subColor="text-gray-400" />
          </div>
        </div>
      )}

      {/* Last week summary */}
      {lws && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Last week</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniCard icon={<Trophy size={13} className="text-amber-300" />} label="Best day" value={sd(lws.best.session_date)} sub={formatUSD(lws.best.total_usd_session)} subColor="text-gray-600" />
            <MiniCard icon={<TrendingDown size={13} className="text-gray-200" />} label="Lowest day" value={sd(lws.worst.session_date)} sub={formatUSD(lws.worst.total_usd_session)} subColor="text-gray-400" />
            <MiniCard icon={<DollarSign size={13} className="text-emerald-300" />} label="Week total" value={formatUSD(lws.totalUSD)} sub={`${lws.count} sessions`} subColor="text-gray-400" />
            <MiniCard icon={<Users size={13} className="text-blue-300" />} label="Avg viewers" value={String(lws.avgViewers)} sub={formatMinutes(lws.totalMins) + ' streamed'} subColor="text-gray-400" />
          </div>
        </div>
      )}

      {/* This month summary */}
      {ms && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">This month</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniCard icon={<Trophy size={13} className="text-amber-400" />} label="Best day" value={sd(ms.best.session_date)} sub={formatUSD(ms.best.total_usd_session)} subColor="text-brand" />
            <MiniCard icon={<TrendingDown size={13} className="text-gray-300" />} label="Lowest day" value={sd(ms.worst.session_date)} sub={formatUSD(ms.worst.total_usd_session)} subColor="text-gray-400" />
            <MiniCard icon={<DollarSign size={13} className="text-green-400" />} label="Month total" value={formatUSD(ms.totalUSD)} sub={`${ms.count} sessions`} subColor="text-gray-400" />
            <MiniCard icon={<Users size={13} className="text-blue-400" />} label="Avg viewers" value={String(ms.avgViewers)} sub={formatMinutes(ms.totalMins) + ' streamed'} subColor="text-gray-400" />
          </div>
        </div>
      )}

      {/* Depth filter tabs + session list */}
      <div className="space-y-3">
        <div className="flex gap-1 bg-gray-100/70 p-1 rounded-xl w-fit">
          {depthTabs.map((t) => (
            <button key={t.key} onClick={() => setDepthFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                depthFilter === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  depthFilter === t.key ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No sessions in this period.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredSessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  expanded={expandedId === s.id}
                  onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  onUpdateNotes={handleUpdateNotes}
                  isThisWeek={s.session_date >= weekStart && s.session_date <= weekEnd}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Session">
        <SessionForm onSuccess={handleAddSession} />
      </SlideOver>
    </div>
  )
}

function MiniCard({
  icon, label, value, sub, subColor,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; subColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      <p className={`text-xs font-medium mt-0.5 ${subColor}`}>{sub}</p>
    </div>
  )
}

function SessionRow({
  session, expanded, onToggle, onUpdateNotes, isThisWeek,
}: {
  session: StreamSession; expanded: boolean; onToggle: () => void
  onUpdateNotes: (id: string, notes: string) => void; isThisWeek: boolean
}) {
  const [notes, setNotes] = useState(session.notes || '')
  const [isEditing, setIsEditing] = useState(false)
  const moodRating = (session as any).mood_rating
  const streamType = (session as any).stream_type
  const prepTimeMins = (session as any).prep_time_minutes ?? 0
  const dow = new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
  const mmdd = new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <>
      <div
        onClick={onToggle}
        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${
          expanded ? 'bg-blue-50/30' : ''
        }`}
      >
        <div className={`w-10 text-center shrink-0 ${isThisWeek ? '' : 'opacity-50'}`}>
          <div className="text-[10px] font-bold text-gray-400 uppercase">{dow}</div>
          <div className="text-sm font-bold text-gray-900 leading-tight">{mmdd.split(' ')[1]}</div>
          <div className="text-[10px] text-gray-400">{mmdd.split(' ')[0]}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{formatUSD(session.total_usd_session)}</span>
            {streamType && (
              <span className="text-[10px] bg-blue-50 text-brand font-semibold px-1.5 py-0.5 rounded-full">
                {streamType}
              </span>
            )}
            {moodRating && (
              <span className="text-[10px] text-amber-400">{'★'.repeat(moodRating)}</span>
            )}
            {isThisWeek && (
              <span className="text-[10px] bg-green-50 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">
                this week
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            <span>{session.start_time?.slice(0, 5)}</span>
            <span>&middot;</span>
            <span>{formatMinutes(session.stream_length_minutes)}</span>
            <span>&middot;</span>
            <span>{session.most_viewers} peak</span>
            <span>&middot;</span>
            <span>#{session.best_rank}</span>
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-semibold text-gray-700">
            {formatUSD(session.usd_per_hour)}
            <span className="text-xs font-normal text-gray-400">/hr</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">+{session.followers_gained} followers</div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-blue-50/20 border-t border-blue-100/60">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-3 pb-3">
            {/* Viewers: peak primary, avg secondary */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Peak viewers</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{session.most_viewers ?? '—'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">avg {session.avg_viewers}</p>
            </div>
            {/* Session earnings */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Earnings</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatUSD(session.total_usd_session)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatUSD(session.usd_per_hour)}/hr</p>
            </div>
            {/* Tips: tokens primary, members secondary */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tips (tokens)</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{session.tips_this_session?.toLocaleString() ?? '—'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{session.members_tipped} tippers</p>
            </div>
            {/* Page number — show as decimal */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Page #</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {session.page_number != null ? Number(session.page_number).toFixed(1) : '—'}
              </p>
            </div>
            {/* Best rank */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Best rank</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">#{session.best_rank}</p>
            </div>
            {/* Prep time if available */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Prep time</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {prepTimeMins > 0 ? `${prepTimeMins}m` : '—'}
              </p>
            </div>
          </div>
          <div className="border-t border-blue-100/80 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Notes</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing) }}
                className="text-xs text-brand hover:underline"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  rows={2}
                />
                <button
                  onClick={async () => { await onUpdateNotes(session.id, notes); setIsEditing(false) }}
                  className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {notes || <span className="text-gray-300 italic">No notes</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
