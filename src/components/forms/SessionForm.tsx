'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StreamSession } from '@/types'

interface SessionFormProps {
  onSubmit?: (session: Partial<StreamSession>) => void
  onSuccess?: () => void
  isLoading?: boolean
}

const INPUT = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

export function SessionForm({ onSubmit, onSuccess, isLoading = false }: SessionFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    start_time: '12:00',
    end_time: '14:00',
    stream_length_minutes: 120,
    most_viewers: 100,
    avg_viewers: 50,
    best_rank: 1000,
    avg_rank: 2000,
    best_gender_rank: 500,
    avg_gender_rank: 1000,
    page_number: 1,
    start_followers: 0,
    end_followers: 10,
    tips_this_session: 50,
    members_tipped: 10,
    usd_per_hour: 25,
    total_usd_session: 50,
    prep_time_minutes: 0,
    mood_rating: 0,
    stream_type: '',
    notes: '',
  })

  const set = (k: string, v: any) => setFormData((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = { ...formData, mood_rating: formData.mood_rating || null }
    if (onSubmit) {
      onSubmit(payload)
    } else {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (response.ok) { router.refresh(); if (onSuccess) onSuccess() }
      } catch (error) { console.error(error) }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date + time */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Date</label>
          <input type="date" value={formData.session_date} onChange={(e) => set('session_date', e.target.value)} className={INPUT} /></div>
        <div><label className={LABEL}>Start time</label>
          <input type="time" value={formData.start_time} onChange={(e) => set('start_time', e.target.value)} className={INPUT} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>End time</label>
          <input type="time" value={formData.end_time} onChange={(e) => set('end_time', e.target.value)} className={INPUT} /></div>
        <div><label className={LABEL}>Length (min)</label>
          <input type="number" value={formData.stream_length_minutes} onChange={(e) => set('stream_length_minutes', parseInt(e.target.value))} className={INPUT} /></div>
      </div>

      {/* Stream type + prep time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Stream type</label>
          <select value={formData.stream_type} onChange={(e) => set('stream_type', e.target.value)} className={INPUT}>
            <option value="">— none —</option>
            <option>Regular</option>
            <option>Special event</option>
            <option>Goal show</option>
            <option>Collab</option>
          </select>
        </div>
        <div><label className={LABEL}>Prep time (min)</label>
          <input type="number" min={0} value={formData.prep_time_minutes} onChange={(e) => set('prep_time_minutes', parseInt(e.target.value) || 0)} className={INPUT} /></div>
      </div>

      {/* Mood */}
      <div>
        <label className={LABEL}>Mood</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map((n) => (
            <button key={n} type="button"
              onClick={() => set('mood_rating', formData.mood_rating === n ? 0 : n)}
              className={`text-2xl transition-opacity ${n <= formData.mood_rating ? 'opacity-100' : 'opacity-25'}`}
            >★</button>
          ))}
        </div>
      </div>

      {/* Viewers */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Peak viewers</label>
          <input type="number" value={formData.most_viewers} onChange={(e) => set('most_viewers', parseInt(e.target.value))} className={INPUT} /></div>
        <div><label className={LABEL}>Avg viewers</label>
          <input type="number" value={formData.avg_viewers} onChange={(e) => set('avg_viewers', parseInt(e.target.value))} className={INPUT} /></div>
      </div>

      {/* Ranks */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Best rank</label>
          <input type="number" value={formData.best_rank} onChange={(e) => set('best_rank', parseInt(e.target.value))} className={INPUT} /></div>
        <div><label className={LABEL}>Avg rank</label>
          <input type="number" value={formData.avg_rank} onChange={(e) => set('avg_rank', parseInt(e.target.value))} className={INPUT} /></div>
      </div>

      {/* Followers */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Start followers</label>
          <input type="number" value={formData.start_followers} onChange={(e) => set('start_followers', parseInt(e.target.value))} className={INPUT} /></div>
        <div><label className={LABEL}>End followers</label>
          <input type="number" value={formData.end_followers} onChange={(e) => set('end_followers', parseInt(e.target.value))} className={INPUT} /></div>
      </div>

      {/* Tips + USD */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Tips (tokens)</label>
          <input type="number" value={formData.tips_this_session} onChange={(e) => set('tips_this_session', parseInt(e.target.value))} className={INPUT} /></div>
        <div><label className={LABEL}>Total USD</label>
          <input type="number" step="0.01" value={formData.total_usd_session} onChange={(e) => set('total_usd_session', parseFloat(e.target.value))} className={INPUT} /></div>
      </div>

      <div><label className={LABEL}>Notes</label>
        <textarea value={formData.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
          className={INPUT + ' resize-none'} /></div>

      <button type="submit" disabled={isLoading}
        className="w-full bg-brand hover:bg-[#1d4ed8] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
        {isLoading ? 'Saving...' : 'Add Session'}
      </button>
    </form>
  )
}
