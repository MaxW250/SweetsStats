'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, TrendingUp, Users, DollarSign, Zap, Pencil, Trash2, X, Check } from 'lucide-react'
import { formatUSD, formatDate } from '@/lib/utils'

interface OFEntry {
  id: string
  entry_date: string
  new_subs: number
  total_subs: number | null
  revenue_usd: number
  tokens_received: number
  streamed_that_day: boolean
  stream_session_id: string | null
  notes: string | null
}

interface Session {
  id: string
  session_date: string
  start_time: string
  stream_length_minutes: number
  most_viewers: number
  avg_viewers: number
  total_usd_session: number
}

const BLANK_FORM = {
  entry_date: new Date().toISOString().split('T')[0],
  new_subs: 0,
  total_subs: '',
  revenue_usd: 0,
  tokens_received: 0,
  streamed_that_day: false,
  stream_session_id: '',
  notes: '',
}

export default function OnlyFansPage() {
  const [entries, setEntries] = useState<OFEntry[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Manage entries state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<OFEntry>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showManage, setShowManage] = useState(false)

  const fetchAll = async () => {
    const [of, sess] = await Promise.all([
      fetch('/api/onlyfans').then((r) => r.json()),
      fetch('/api/sessions').then((r) => r.json()),
    ])
    setEntries(Array.isArray(of) ? of : [])
    setSessions(Array.isArray(sess) ? sess : [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const sessionById = useMemo(() => {
    const map: Record<string, Session> = {}
    sessions.forEach((s) => { map[s.id] = s })
    return map
  }, [sessions])

  const sessionByDate = useMemo(() => {
    const map: Record<string, Session> = {}
    sessions.forEach((s) => { map[s.session_date] = s })
    return map
  }, [sessions])

  const sessionsOnDate = useMemo(() => {
    return sessions.filter((s) => s.session_date === form.entry_date)
  }, [sessions, form.entry_date])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        total_subs: form.total_subs ? parseInt(String(form.total_subs)) : null,
        stream_session_id: form.stream_session_id || null,
      }
      const r = await fetch('/api/onlyfans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        await fetchAll()
        setShowForm(false)
        setForm({ ...BLANK_FORM })
        setMsg('Saved!')
        setTimeout(() => setMsg(''), 3000)
      }
    } finally { setSaving(false) }
  }

  const handleEditSave = async (id: string) => {
    const r = await fetch(`/api/onlyfans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (r.ok) {
      await fetchAll()
      setEditingId(null)
      setMsg('Updated!')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/onlyfans/${id}`, { method: 'DELETE' })
    if (r.ok) {
      await fetchAll()
      setDeletingId(null)
      setMsg('Entry deleted.')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  // Chart data
  const last60 = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date)).slice(-60)
    return sorted.map((e) => {
      const linkedSess = e.stream_session_id
        ? sessionById[e.stream_session_id]
        : (e.streamed_that_day ? sessionByDate[e.entry_date] : undefined)
      return {
        date: e.entry_date.slice(5),
        newSubs: e.new_subs,
        revenue: Number(e.revenue_usd),
        streamed: e.streamed_that_day,
        cbEarnings: linkedSess?.total_usd_session ?? null,
        peakViewers: linkedSess?.most_viewers ?? null,
      }
    })
  }, [entries, sessionById, sessionByDate])

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach((e) => {
      const m = e.entry_date.slice(0, 7)
      map[m] = (map[m] ?? 0) + Number(e.revenue_usd)
    })
    return Object.entries(map).sort().map(([month, usd]) => ({ month, usd }))
  }, [entries])

  const streamImpact = useMemo(() => {
    const stream = entries.filter((e) => e.streamed_that_day)
    const noStream = entries.filter((e) => !e.streamed_that_day)
    const avgStream = stream.length ? stream.reduce((s, e) => s + e.new_subs, 0) / stream.length : 0
    const avgNo = noStream.length ? noStream.reduce((s, e) => s + e.new_subs, 0) / noStream.length : 0
    const pct = avgNo > 0 ? Math.round(((avgStream - avgNo) / avgNo) * 100) : 0
    return { avgStream: Math.round(avgStream * 10) / 10, avgNo: Math.round(avgNo * 10) / 10, pct }
  }, [entries])

  const stackedMonthly = useMemo(() => {
    const map: Record<string, { of: number; cb: number }> = {}
    entries.forEach((e) => {
      const m = e.entry_date.slice(0, 7)
      if (!map[m]) map[m] = { of: 0, cb: 0 }
      map[m].of += Number(e.revenue_usd)
    })
    return Object.entries(map).sort().map(([month, v]) => ({ month: month.slice(5), of: v.of, cb: v.cb }))
  }, [entries])

  const tableRows = useMemo(() => {
    return [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).map((e) => {
      const linkedSess = e.stream_session_id
        ? sessionById[e.stream_session_id]
        : (e.streamed_that_day ? sessionByDate[e.entry_date] : undefined)
      return {
        ...e,
        cbEarnings: linkedSess?.total_usd_session ?? null,
        peakViewers: linkedSess?.most_viewers ?? null,
        streamMins: linkedSess?.stream_length_minutes ?? null,
      }
    })
  }, [entries, sessionById, sessionByDate])

  const totalRevenue = entries.reduce((s, e) => s + Number(e.revenue_usd), 0)
  const totalSubs = entries.reduce((s, e) => s + e.new_subs, 0)

  const INPUT = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20'
  const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  const SubsTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs space-y-1" style={{ minWidth: 140 }}>
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-gray-600">New subs: <span className="font-bold text-gray-900">{d.newSubs}</span></p>
        {d.streamed && (
          <>
            {d.cbEarnings != null && <p className="text-brand">CB earnings: <span className="font-bold">{formatUSD(d.cbEarnings)}</span></p>}
            {d.peakViewers != null && <p className="text-gray-600">Peak viewers: <span className="font-bold text-gray-900">{d.peakViewers}</span></p>}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">OnlyFans</h1>
          <p className="text-sm text-gray-400 mt-0.5">{entries.length} entries · ${totalRevenue.toFixed(2)} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManage(!showManage)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
            <Pencil size={14} /> Manage
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} /> Log Entry
          </button>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">{msg}</div>}

      {/* New entry form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">New entry</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Date</label>
              <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value, stream_session_id: '' })} className={INPUT} /></div>
            <div><label className={LABEL}>New subs</label>
              <input type="number" min={0} value={form.new_subs} onChange={(e) => setForm({ ...form, new_subs: parseInt(e.target.value) || 0 })} className={INPUT} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Total subs</label>
              <input type="number" min={0} value={form.total_subs} onChange={(e) => setForm({ ...form, total_subs: e.target.value })} className={INPUT} placeholder="optional" /></div>
            <div><label className={LABEL}>Revenue (USD)</label>
              <input type="number" step="0.01" min={0} value={form.revenue_usd} onChange={(e) => setForm({ ...form, revenue_usd: parseFloat(e.target.value) || 0 })} className={INPUT} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Tokens received</label>
              <input type="number" min={0} value={form.tokens_received} onChange={(e) => setForm({ ...form, tokens_received: parseInt(e.target.value) || 0 })} className={INPUT} /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.streamed_that_day} onChange={(e) => setForm({ ...form, streamed_that_day: e.target.checked, stream_session_id: '' })}
                  className="w-4 h-4 rounded accent-brand" />
                <span className="text-sm font-medium text-gray-700">Streamed on CB today?</span>
              </label>
            </div>
          </div>
          {form.streamed_that_day && sessionsOnDate.length > 0 && (
            <div><label className={LABEL}>Link to CB session</label>
              <select value={form.stream_session_id} onChange={(e) => setForm({ ...form, stream_session_id: e.target.value })} className={INPUT}>
                <option value="">— select —</option>
                {sessionsOnDate.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.session_date} {s.start_time?.slice(0,5)} — ${s.total_usd_session}</option>
                ))}
              </select>
            </div>
          )}
          <div><label className={LABEL}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={INPUT + ' resize-none'} /></div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2.5 bg-brand hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save entry'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Entry management list */}
      {showManage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Manage entries</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Edit or delete existing OnlyFans entries</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No entries yet.</div>
            ) : (
              [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).map((entry) => (
                <div key={entry.id} className="px-4 py-3">
                  {editingId === entry.id ? (
                    /* Inline edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Date</label>
                          <input type="date" value={editForm.entry_date ?? ''} onChange={(e) => setEditForm({ ...editForm, entry_date: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">New subs</label>
                          <input type="number" min={0} value={editForm.new_subs ?? 0} onChange={(e) => setEditForm({ ...editForm, new_subs: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Revenue (USD)</label>
                          <input type="number" step="0.01" min={0} value={editForm.revenue_usd ?? 0} onChange={(e) => setEditForm({ ...editForm, revenue_usd: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Tokens</label>
                          <input type="number" min={0} value={editForm.tokens_received ?? 0} onChange={(e) => setEditForm({ ...editForm, tokens_received: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                          <input type="checkbox" checked={editForm.streamed_that_day ?? false} onChange={(e) => setEditForm({ ...editForm, streamed_that_day: e.target.checked })}
                            className="w-3.5 h-3.5 accent-brand" />
                          Streamed on CB
                        </label>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Notes</label>
                        <input type="text" value={editForm.notes ?? ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none" placeholder="Notes..." />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditSave(entry.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg">
                          <Check size={12} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Row display */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm font-semibold text-gray-700 w-24 shrink-0">{formatDate(entry.entry_date)}</span>
                        <span className="text-xs text-gray-500">{entry.new_subs} subs</span>
                        <span className="text-xs text-gray-500">${Number(entry.revenue_usd).toFixed(2)}</span>
                        {entry.streamed_that_day && (
                          <span className="text-[10px] bg-blue-50 text-brand font-semibold px-2 py-0.5 rounded-full">CB stream</span>
                        )}
                        {entry.notes && (
                          <span className="text-xs text-gray-400 italic truncate max-w-[140px]">{entry.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => { setEditingId(entry.id); setEditForm({ ...entry }) }}
                          className="p-1.5 text-gray-400 hover:text-brand hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        {deletingId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button onClick={() => handleDelete(entry.id)}
                              className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-lg">Yes</button>
                            <button onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={15} className="text-green-500" />, bg: 'bg-green-50' },
          { label: 'Total new subs', value: String(totalSubs), icon: <Users size={15} className="text-brand" />, bg: 'bg-blue-50' },
          { label: 'Stream day avg subs', value: String(streamImpact.avgStream), icon: <Zap size={15} className="text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Non-stream avg subs', value: String(streamImpact.avgNo), icon: <TrendingUp size={15} className="text-purple-500" />, bg: 'bg-purple-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2`}>{icon}</div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Stream impact comparison */}
      {entries.length >= 5 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">CB stream effect on OF subs</h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand">{streamImpact.avgStream}</p>
              <p className="text-xs text-gray-400 mt-1">avg subs<br/>on stream days</p>
            </div>
            <div className="flex-1 text-center">
              <div className={`text-lg font-bold ${streamImpact.pct >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                {streamImpact.pct >= 0 ? '+' : ''}{streamImpact.pct}%
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {streamImpact.pct >= 0 ? 'more subs on stream days' : 'fewer subs on stream days'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{streamImpact.avgNo}</p>
              <p className="text-xs text-gray-400 mt-1">avg subs<br/>off days</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading data...</div>
      ) : entries.length < 2 ? (
        <div className="py-12 text-center text-sm text-gray-400">Add more entries to see charts.</div>
      ) : (
        <div className="space-y-4">
          {/* New subs per day */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">New subs per day (last 60d)</h3>
            <p className="text-[11px] text-gray-400 mb-4">Hover stream days (blue) to see CB earnings + peak viewers</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last60} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<SubsTooltip />} />
                <Bar dataKey="newSubs" radius={[3, 3, 0, 0]}>
                  {last60.map((e, i) => (
                    <Cell key={i} fill={e.streamed ? '#2563EB' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-brand inline-block" /> CB stream day</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" /> No stream</span>
            </div>
          </div>

          {/* Monthly OF revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly OF revenue</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="usd" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly stacked CB + OF */}
          {stackedMonthly.length >= 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly CB + OF combined revenue</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stackedMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }} formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="cb" stackId="a" fill="#2563EB" radius={[0,0,0,0]} name="CB" />
                  <Bar dataKey="of" stackId="a" fill="#93c5fd" radius={[3,3,0,0]} name="OF" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-brand inline-block" /> Chaturbate</span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block" /> OnlyFans</span>
              </div>
            </div>
          )}

          {/* Full data table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Full data log</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">CB earnings and viewers pulled from linked stream sessions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">New subs</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">OF revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Streamed?</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CB earnings</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Peak viewers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-700">{formatDate(row.entry_date)}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{row.new_subs}</td>
                      <td className="px-4 py-3 text-gray-700">${Number(row.revenue_usd).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {row.streamed_that_day
                          ? <span className="text-[11px] bg-blue-50 text-brand font-semibold px-2 py-0.5 rounded-full">Yes</span>
                          : <span className="text-[11px] text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.cbEarnings != null ? formatUSD(row.cbEarnings) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.peakViewers != null ? row.peakViewers.toLocaleString() : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
