'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StreamSession } from '@/types'

interface SessionFormProps {
  onSubmit?: (session: Partial<StreamSession>) => void
  onSuccess?: () => void
  isLoading?: boolean
}

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
    notes: '',
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    } else {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          router.refresh()
          if (onSuccess) onSuccess()
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.session_date}
            onChange={(e) =>
              setFormData({ ...formData, session_date: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) =>
              setFormData({ ...formData, end_time: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Stream Length (min)
          </label>
          <input
            type="number"
            value={formData.stream_length_minutes}
            onChange={(e) =>
              setFormData({ ...formData, stream_length_minutes: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Peak Viewers
          </label>
          <input
            type="number"
            value={formData.most_viewers}
            onChange={(e) =>
              setFormData({ ...formData, most_viewers: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Avg Viewers
          </label>
          <input
            type="number"
            value={formData.avg_viewers}
            onChange={(e) =>
              setFormData({ ...formData, avg_viewers: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Best Rank
          </label>
          <input
            type="number"
            value={formData.best_rank}
            onChange={(e) =>
              setFormData({ ...formData, best_rank: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Avg Rank
          </label>
          <input
            type="number"
            value={formData.avg_rank}
            onChange={(e) =>
              setFormData({ ...formData, avg_rank: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Start Followers
          </label>
          <input
            type="number"
            value={formData.start_followers}
            onChange={(e) =>
              setFormData({ ...formData, start_followers: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            End Followers
          </label>
          <input
            type="number"
            value={formData.end_followers}
            onChange={(e) =>
              setFormData({ ...formData, end_followers: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Tips
          </label>
          <input
            type="number"
            value={formData.tips_this_session}
            onChange={(e) =>
              setFormData({ ...formData, tips_this_session: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Total USD
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.total_usd_session}
            onChange={(e) =>
              setFormData({ ...formData, total_usd_session: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-coral hover:bg-[#e86a5a] text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Add Session'}
      </button>
    </form>
  )
}
