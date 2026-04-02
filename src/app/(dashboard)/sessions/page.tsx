'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatUSD, formatMinutes } from '@/lib/utils'
import { SlideOver } from '@/components/ui/SlideOver'
import { SessionForm } from '@/components/forms/SessionForm'
import { Plus, TrendingDown, Trophy, DollarSign, Users } from 'lucide-react'
import type { StreamSession } from '@/types'

function getThisWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

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
  const thisWeek = useMemo(
    () => sessions.filter((s) => s.session_date >= weekStart && s.session_date <= weekEnd),
    [sessions, weekStart, weekEnd]
  )

  const ws = useMemo(() => {
    if (!thisWeek.length) return null
    const sorted = [...thisWeek].sort((a, b) => (b.total_usd_session ?? 0) - (a.total_usd_session ?? 0))
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      totalUSD: thisWeek.reduce((s, x) => s + (x.total_usd_session ?? 0), 0),
      totalMins: thisWeek.reduce((s, x) => s + (x.stream_length_minutes ?? 0), 0),
      avgViewers: Math.round(thisWeek.reduce((s, x) => s + (x.avg_viewers ?? 0), 0) / thisWeek.length),
      count: thisWeek.length,
    }
  }, [thisWeek])

  const sd = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

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

      {ws && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">This week</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniCard
              icon={<Trophy size={13} className="text-amber-400" />}
              label="Best day"
              value={sd(ws.best.session_date)}
              sub={formatUSD(ws.best.total_usd_session)}
              subColor="text-brand"
            />
            <MiniCard
              icon={<TrendingDown size={13} className="text-gray-300" />}
              label="Lowest day"
              value={sd(ws.worst.session_date)}
              sub={formatUSD(ws.worst.total_usd_session)}
              subColor="text-gray-400"
            />
            <MiniCard
              icon={<DollarSign size={13} className="text-green-400" />}
              label="Week total"
              value={formatUSD(ws.totalUSD)}
              sub={`${ws.count} sessions`}
              subColor="text-gray-400"
            />
            <MiniCard
              icon={<Users size={13} className="text-blue-400" />}
              label="Avg viewers"
              value={String(ws.avgViewers)}
              sub={formatMinutes(ws.totalMins) + ' streamed'}
              subColor="text-gray-400"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No sessions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sessions.map((s) => (
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
            <span>{session.avg_viewers} viewers</span>
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
            {(
              [
                ['Peak viewers', session.most_viewers],
                ['Best rank', `#${session.best_rank}`],
                ['Members tipped', session.members_tipped],
                ['Tips (tokens)', session.tips_this_session],
                ['Page #', session.page_number],
                ['$/hr', formatUSD(session.usd_per_hour)],
              ] as [string, any][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
              </div>
            ))}
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
