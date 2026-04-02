'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatUSD, formatDate, formatTokens } from '@/lib/utils'
import { SlideOver } from '@/components/ui/SlideOver'
import { TipperForm } from '@/components/forms/TipperForm'
import { Star, Plus, AlertTriangle } from 'lucide-react'
import type { Tipper } from '@/types'

type FilterTab = 'all' | 'vip' | 'active' | 'at-risk'

function daysSince(dateStr?: string | null): number {
  if (!dateStr) return 9999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function ActivityDot({ lastSeen }: { lastSeen?: string | null }) {
  const days = daysSince(lastSeen)
  if (days <= 30) return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Active (last 30d)" />
  if (days <= 60) return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Fading (31–60d)" />
  return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" title="At risk (60d+)" />
}

export default function TippersPage() {
  const [tippers, setTippers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('total_usd_all_time')
  const [tab, setTab] = useState<FilterTab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => { fetchTippers() }, [search, sort])

  const fetchTippers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (sort) params.append('sort', sort)
      setTippers(await (await fetch(`/api/tippers?${params}`)).json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleVip = async (id: string, current: boolean) => {
    await fetch(`/api/tippers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_vip: !current }),
    })
    await fetchTippers()
  }

  const sorted = useMemo(() => {
    return [...tippers].sort((a, b) => {
      switch (sort) {
        case 'total_usd_all_time': return b.total_usd_all_time - a.total_usd_all_time
        case 'total_tokens_all_time': return b.total_tokens_all_time - a.total_tokens_all_time
        case 'biggest_single_tip_usd': return b.biggest_single_tip_usd - a.biggest_single_tip_usd
        case 'last_seen_date': return new Date(b.last_seen_date).getTime() - new Date(a.last_seen_date).getTime()
        case 'number_of_tips': return b.number_of_tips - a.number_of_tips
        default: return 0
      }
    })
  }, [tippers, sort])

  const filtered = useMemo(() => {
    switch (tab) {
      case 'vip': return sorted.filter((t) => t.is_vip)
      case 'active': return sorted.filter((t) => daysSince(t.last_seen_date) <= 30)
      case 'at-risk': return sorted.filter((t) => daysSince(t.last_seen_date) > 60)
      default: return sorted
    }
  }, [sorted, tab])

  const atRisk = useMemo(() => sorted.filter((t) => daysSince(t.last_seen_date) > 60), [sorted])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: sorted.length },
    { key: 'vip', label: 'VIP', count: sorted.filter((t) => t.is_vip).length },
    { key: 'active', label: 'Active', count: sorted.filter((t) => daysSince(t.last_seen_date) <= 30).length },
    { key: 'at-risk', label: 'At risk', count: atRisk.length },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tippers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sorted.length} supporters tracked</p>
        </div>
        <button onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} /> Add Tipper
        </button>
      </div>

      {/* Search + sort */}
      <div className="flex gap-3">
        <input type="text" placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="total_usd_all_time">By USD</option>
          <option value="total_tokens_all_time">By Tokens</option>
          <option value="number_of_tips">By Tips</option>
          <option value="biggest_single_tip_usd">By Biggest Tip</option>
          <option value="last_seen_date">By Last Seen</option>
        </select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100/70 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tippers table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No tippers found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((tipper, idx) => (
              <TipperRow
                key={tipper.id}
                tipper={tipper}
                rank={sorted.indexOf(tipper) + 1}
                expanded={expandedId === tipper.id}
                onToggle={() => setExpandedId(expandedId === tipper.id ? null : tipper.id)}
                onToggleVip={() => toggleVip(tipper.id, tipper.is_vip)}
              />
            ))}
          </div>
        )}
      </div>

      {/* At-risk section */}
      {atRisk.length > 0 && tab === 'all' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <h3 className="text-sm font-semibold text-gray-700">At risk — gone 60+ days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {atRisk.slice(0, 6).map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900 truncate">{t.username}</span>
                  {t.is_vip && <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500">{formatUSD(t.total_usd_all_time)} lifetime</p>
                <p className="text-xs text-red-400 mt-1">{daysSince(t.last_seen_date)} days since last seen</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Tipper">
        <TipperForm onSuccess={async () => { await fetchTippers(); setIsFormOpen(false) }} />
      </SlideOver>
    </div>
  )
}

function TipperRow({ tipper, rank, expanded, onToggle, onToggleVip }: {
  tipper: any; rank: number; expanded: boolean; onToggle: () => void; onToggleVip: () => void
}) {
  const days = daysSince(tipper.last_seen_date)
  return (
    <>
      <div onClick={onToggle} className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/20' : ''}`}>
        <span className="text-xs font-bold text-gray-300 w-5 text-center shrink-0">{rank}</span>
        <ActivityDot lastSeen={tipper.last_seen_date} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{tipper.username}</span>
            {tipper.is_vip && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            <span>{formatUSD(tipper.total_usd_all_time)}</span>
            <span>&middot;</span>
            <span>{tipper.number_of_tips} tips</span>
            <span>&middot;</span>
            <span>best {formatUSD(tipper.biggest_single_tip_usd)}</span>
          </div>
        </div>
        <div className="text-right hidden sm:block shrink-0">
          <p className="text-xs text-gray-400">{tipper.last_seen_date ? formatDate(tipper.last_seen_date) : '—'}</p>
          {days <= 9998 && <p className={`text-[10px] font-medium mt-0.5 ${days <= 30 ? 'text-green-500' : days <= 60 ? 'text-amber-500' : 'text-red-400'}`}>{days}d ago</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVip() }}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          title={tipper.is_vip ? 'Remove VIP' : 'Make VIP'}
        >
          <Star size={15} className={tipper.is_vip ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 bg-blue-50/10 border-t border-blue-100/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tokens</p><p className="text-sm font-bold text-gray-900 mt-0.5">{formatTokens(tipper.total_tokens_all_time)}</p></div>
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Biggest tip</p><p className="text-sm font-bold text-gray-900 mt-0.5">{formatUSD(tipper.biggest_single_tip_usd)}</p></div>
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">First seen</p><p className="text-sm font-bold text-gray-900 mt-0.5">{tipper.first_seen_date ? formatDate(tipper.first_seen_date) : '—'}</p></div>
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last seen</p><p className="text-sm font-bold text-gray-900 mt-0.5">{tipper.last_seen_date ? formatDate(tipper.last_seen_date) : '—'}</p></div>
          </div>
          {tipper.notes && <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-blue-100/60">{tipper.notes}</p>}
        </div>
      )}
    </>
  )
}
