'use client'

import { useState, useEffect } from 'react'
import { formatUSD, formatDate, formatTokens } from '@/lib/utils'
import { SlideOver } from '@/components/ui/SlideOver'
import { TipperForm } from '@/components/forms/TipperForm'
import type { Tipper } from '@/types'

export default function TippersPage() {
  const [tippers, setTippers] = useState<Tipper[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('total_usd_all_time')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchTippers()
  }, [search, sort])

  const fetchTippers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (sort) params.append('sort', sort)

      const response = await fetch(`/api/tippers?${params}`)
      const data = await response.json()
      setTippers(data)
    } catch (error) {
      console.error('Failed to fetch tippers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTipper = async () => {
    await fetchTippers()
    setIsFormOpen(false)
  }

  const sortedTippers = [...tippers].sort((a, b) => {
    switch (sort) {
      case 'total_usd_all_time':
        return b.total_usd_all_time - a.total_usd_all_time
      case 'total_tokens_all_time':
        return b.total_tokens_all_time - a.total_tokens_all_time
      case 'biggest_single_tip_usd':
        return b.biggest_single_tip_usd - a.biggest_single_tip_usd
      case 'last_seen_date':
        return new Date(b.last_seen_date).getTime() - new Date(a.last_seen_date).getTime()
      case 'number_of_tips':
        return b.number_of_tips - a.number_of_tips
      default:
        return 0
    }
  })

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            Tippers
          </h1>
          <p className="text-gray-600 mt-2">Your valued supporters</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-coral hover:bg-[#e86a5a] text-white rounded-lg font-medium transition-colors"
        >
          + Add Tipper
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="total_usd_all_time">Sort by USD</option>
          <option value="total_tokens_all_time">Sort by Tokens</option>
          <option value="number_of_tips">Sort by Tip Count</option>
          <option value="biggest_single_tip_usd">Sort by Biggest Tip</option>
          <option value="last_seen_date">Sort by Last Seen</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Rank</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Username</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Total USD</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Total Tokens</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Tips</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Biggest Tip</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading tippers...
                  </td>
                </tr>
              ) : sortedTippers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No tippers found
                  </td>
                </tr>
              ) : (
                sortedTippers.map((tipper, idx) => (
                  <tr
                    key={tipper.id}
                    onClick={() => setExpandedId(expandedId === tipper.id ? null : tipper.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-3">{tipper.username}</td>
                    <td className="px-6 py-3 font-medium text-coral">
                      {formatUSD(tipper.total_usd_all_time)}
                    </td>
                    <td className="px-6 py-3">{formatTokens(tipper.total_tokens_all_time)}</td>
                    <td className="px-6 py-3">{tipper.number_of_tips}</td>
                    <td className="px-6 py-3">{formatUSD(tipper.biggest_single_tip_usd)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(tipper.last_seen_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {expandedId && (
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            {tippers.find((t) => t.id === expandedId) && (
              <TipperDetail tipper={tippers.find((t) => t.id === expandedId)!} />
            )}
          </div>
        )}
      </div>

      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Tipper"
      >
        <TipperForm onSuccess={handleAddTipper} />
      </SlideOver>
    </div>
  )
}

function TipperDetail({ tipper }: { tipper: Tipper }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 font-medium">First Seen</p>
          <p className="text-sm font-serif font-bold text-gray-900">{formatDate(tipper.first_seen_date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Last Seen</p>
          <p className="text-sm font-serif font-bold text-gray-900">{formatDate(tipper.last_seen_date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Biggest Tip</p>
          <p className="text-sm font-serif font-bold text-coral">{formatUSD(tipper.biggest_single_tip_usd)}</p>
        </div>
      </div>

      {tipper.notes && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Notes</p>
          <p className="text-gray-700">{tipper.notes}</p>
        </div>
      )}
    </div>
  )
}
