'use client'

import { FormEvent, useState } from 'react'
import type { DailyEarning } from '@/types'

interface EarningsFormProps {
  onSubmit?: (earnings: Partial<DailyEarning>) => void
  onSuccess?: () => void
  isLoading?: boolean
}

export function EarningsForm({ onSubmit, onSuccess, isLoading = false }: EarningsFormProps) {
  const [formData, setFormData] = useState({
    earnings_date: new Date().toISOString().split('T')[0],
    total_usd: 100,
    total_tokens: 2000,
    number_of_tips: 50,
    avg_tip_usd: 2,
    avg_tip_tokens: 40,
    highest_tipper_username: '',
    highest_tip_tokens: 100,
    highest_tip_usd: 5,
    number_of_streams: 1,
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    } else {
      try {
        const response = await fetch('/api/daily-earnings', {
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
          Date
        </label>
        <input
          type="date"
          value={formData.earnings_date}
          onChange={(e) =>
            setFormData({ ...formData, earnings_date: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Total USD
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.total_usd}
            onChange={(e) =>
              setFormData({ ...formData, total_usd: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Total Tokens
          </label>
          <input
            type="number"
            value={formData.total_tokens}
            onChange={(e) =>
              setFormData({ ...formData, total_tokens: parseInt(e.target.value) })
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
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Streams Today
          </label>
          <input
            type="number"
            value={formData.number_of_streams}
            onChange={(e) =>
              setFormData({ ...formData, number_of_streams: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Avg Tip USD
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.avg_tip_usd}
            onChange={(e) =>
              setFormData({ ...formData, avg_tip_usd: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Avg Tip Tokens
          </label>
          <input
            type="number"
            value={formData.avg_tip_tokens}
            onChange={(e) =>
              setFormData({ ...formData, avg_tip_tokens: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Highest Tipper Username
        </label>
        <input
          type="text"
          value={formData.highest_tipper_username}
          onChange={(e) =>
            setFormData({ ...formData, highest_tipper_username: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Highest Tip Tokens
          </label>
          <input
            type="number"
            value={formData.highest_tip_tokens}
            onChange={(e) =>
              setFormData({ ...formData, highest_tip_tokens: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Highest Tip USD
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.highest_tip_usd}
            onChange={(e) =>
              setFormData({ ...formData, highest_tip_usd: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-coral hover:bg-[#e86a5a] text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Add Earnings'}
      </button>
    </form>
  )
}
