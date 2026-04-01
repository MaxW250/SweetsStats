'use client'

import { useState, useEffect } from 'react'
import { formatUSD, formatDate, formatMinutes, formatDateTime } from '@/lib/utils'
import { SlideOver } from '@/components/ui/SlideOver'
import { SessionForm } from '@/components/forms/SessionForm'
import type { StreamSession } from '@/types'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`/api/sessions?${params}`)
      const data = await response.json()
      let filtered = data

      if (dayOfWeek) {
        filtered = filtered.filter((s: StreamSession) => {
          const dayName = new Date(s.session_date).toLocaleDateString('en-US', { weekday: 'long' })
          return dayName === dayOfWeek
        })
      }

      if (timeOfDay) {
        filtered = filtered.filter((s: StreamSession) => {
          const hour = parseInt(s.start_time.split(':')[0])
          switch (timeOfDay) {
            case 'morning':
              return hour >= 6 && hour < 12
            case 'afternoon':
              return hour >= 12 && hour < 18
            case 'evening':
              return hour >= 18 && hour < 21
            case 'night':
              return hour >= 21 || hour < 6
            default:
              return true
          }
        })
      }

      setSessions(filtered)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSession = async () => {
    await fetchSessions()
    setIsFormOpen(false)
  }

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      await fetchSessions()
      setExpandedId(null)
    } catch (error) {
      console.error('Failed to update session:', error)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            Stream Sessions
          </h1>
          <p className="text-gray-600 mt-2">Manage and analyze your stream history</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-coral hover:bg-[#e86a5a] text-white rounded-lg font-medium transition-colors"
        >
          + Add Session
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Time of Day
            </label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Times</option>
              <option value="morning">Morning (6am-12pm)</option>
              <option value="afternoon">Afternoon (12pm-6pm)</option>
              <option value="evening">Evening (6pm-9pm)</option>
              <option value="night">Night (9pm-6am)</option>
            </select>
          </div>
        </div>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
        >
          Apply Filters
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Time</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Length</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Peak</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Avg</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Rank</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Followers+</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Tips</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">USD</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">$/hr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    Loading sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3">{formatDate(session.session_date)}</td>
                    <td className="px-6 py-3">{session.start_time}</td>
                    <td className="px-6 py-3">{formatMinutes(session.stream_length_minutes)}</td>
                    <td className="px-6 py-3">{session.most_viewers}</td>
                    <td className="px-6 py-3">{session.avg_viewers}</td>
                    <td className="px-6 py-3">#{session.best_rank}</td>
                    <td className="px-6 py-3">+{session.followers_gained}</td>
                    <td className="px-6 py-3">{session.tips_this_session}</td>
                    <td className="px-6 py-3 font-medium text-coral">
                      {formatUSD(session.total_usd_session)}
                    </td>
                    <td className="px-6 py-3">{formatUSD(session.usd_per_hour)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {expandedId && (
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            {sessions.find((s) => s.id === expandedId) && (
              <SessionDetailExpanded
                session={sessions.find((s) => s.id === expandedId)!}
                onUpdateNotes={handleUpdateNotes}
              />
            )}
          </div>
        )}
      </div>

      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Session"
      >
        <SessionForm onSuccess={handleAddSession} />
      </SlideOver>
    </div>
  )
}

function SessionDetailExpanded({
  session,
  onUpdateNotes,
}: {
  session: StreamSession
  onUpdateNotes: (id: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(session.notes || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveNotes = async () => {
    await onUpdateNotes(session.id, notes)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-600 font-medium">Best Gender Rank</p>
          <p className="text-lg font-serif font-bold text-gray-900">#{session.best_gender_rank}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Avg Gender Rank</p>
          <p className="text-lg font-serif font-bold text-gray-900">#{session.avg_gender_rank}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Page Number</p>
          <p className="text-lg font-serif font-bold text-gray-900">{session.page_number}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Members Tipped</p>
          <p className="text-lg font-serif font-bold text-gray-900">{session.members_tipped}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-900">Notes</label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-coral hover:text-[#e86a5a]"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1 bg-coral hover:bg-[#e86a5a] text-white text-sm rounded-lg"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="text-gray-700">{notes || 'No notes'}</p>
        )}
      </div>
    </div>
  )
}
