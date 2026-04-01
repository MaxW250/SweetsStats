'use client'

import { FormEvent, useState } from 'react'
import type { Tipper } from '@/types'

interface TipperFormProps {
  onSubmit?: (tipper: Partial<Tipper>) => void
  onSuccess?: () => void
  isLoading?: boolean
}

export function TipperForm({ onSubmit, onSuccess, isLoading = false }: TipperFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    total_tokens_all_time: 0,
    total_usd_all_time: 0,
    number_of_tips: 0,
    biggest_single_tip_tokens: 0,
    biggest_single_tip_usd: 0,
    first_seen_date: new Date().toISOString().split('T')[0],
    last_seen_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    } else {
      try {
        const response = await fetch('/api/tippers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (response.ok && onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Username
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Total Tokens
          </label>
          <input
            type="number"
            value={formData.total_tokens_all_time}
            onChange={(e) =>
              setFormData({ ...formData, total_tokens_all_time: parseInt(e.target.value) })
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
            value={formData.total_usd_all_time}
            onChange={(e) =>
              setFormData({ ...formData, total_usd_all_time: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Number of Tips
          </label>
          <input
            type="number"
            value={formData.number_of_tips}
            onChange={(e) =>
              setFormData({ ...formData, number_of_tips: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Biggest Tip Tokens
          </label>
          <input
            type="number"
            value={formData.biggest_single_tip_tokens}
            onChange={(e) =>
              setFormData({ ...formData, biggest_single_tip_tokens: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Biggest Tip USD
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.biggest_single_tip_usd}
            onChange={(e) =>
              setFormData({ ...formData, biggest_single_tip_usd: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            First Seen
          </label>
          <input
            type="date"
            value={formData.first_seen_date}
            onChange={(e) =>
              setFormData({ ...formData, first_seen_date: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Last Seen
          </label>
          <input
            type="date"
            value={formData.last_seen_date}
            onChange={(e) =>
              setFormData({ ...formData, last_seen_date: e.target.value })
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
        {isLoading ? 'Creating...' : 'Add Tipper'}
      </button>
    </form>
  )
}
