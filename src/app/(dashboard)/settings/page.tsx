'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SettingsData {
  token_to_usd_rate?: number
  timezone?: string
  day_score_weights?: string
  chaturbate_api_key?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tokenRate, setTokenRate] = useState(0.05)
  const [timezone, setTimezone] = useState('UTC')
  const [weights, setWeights] = useState({
    usd: 0.4,
    tips: 0.3,
    viewers: 0.2,
    followers: 0.1,
  })
  const [chaturbateKey, setChaturbateKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.token_to_usd_rate) setTokenRate(data.token_to_usd_rate)
      if (data.timezone) setTimezone(data.timezone)
      if (data.chaturbate_api_key) setChaturbateKey(data.chaturbate_api_key)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setMessage('')

    try {
      const settings = [
        { key: 'token_to_usd_rate', value: tokenRate },
        { key: 'timezone', value: timezone },
        { key: 'day_score_weights', value: JSON.stringify(weights) },
        { key: 'chaturbate_api_key', value: chaturbateKey },
      ]

      for (const setting of settings) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        })
      }

      setMessage('Settings saved successfully!')
    } catch (error) {
      setMessage('Failed to save settings')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'dashboard_password', value: newPassword }),
      })

      if (response.ok) {
        setMessage('Password changed successfully! You will need to log in again.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setMessage('Failed to change password')
      }
    } catch (error) {
      setMessage('Failed to change password')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure? This action cannot be undone!')) return

    setLoading(true)
    try {
      const tables = ['stream_sessions', 'daily_earnings', 'tippers']
      for (const table of tables) {
        await fetch(`/api/${table}`, {
          method: 'DELETE',
        })
      }
      setMessage('All data deleted successfully')
    } catch (error) {
      setMessage('Failed to delete data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalWeight = weights.usd + weights.tips + weights.viewers + weights.followers

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your dashboard</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('successfully') || message.includes('cannot')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
            Change Password
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-coral hover:bg-[#e86a5a] text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
            Earnings Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Token to USD Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={tokenRate}
                  onChange={(e) => setTokenRate(parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
                />
                <span className="text-gray-600">USD per token</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              >
                <option>UTC</option>
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
            Day Score Weights
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Adjust how much each metric contributes to your day score (must total 100%)
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">USD ({Math.round(weights.usd * 100)}%)</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.usd}
                onChange={(e) =>
                  setWeights({ ...weights, usd: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Tips ({Math.round(weights.tips * 100)}%)</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.tips}
                onChange={(e) =>
                  setWeights({ ...weights, tips: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Viewers ({Math.round(weights.viewers * 100)}%)</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.viewers}
                onChange={(e) =>
                  setWeights({ ...weights, viewers: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Followers ({Math.round(weights.followers * 100)}%)</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.followers}
                onChange={(e) =>
                  setWeights({ ...weights, followers: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="bg-gray-50 p-2 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                Total: {Math.round(totalWeight * 100)}% {totalWeight.toFixed(2) === '1.00' ? '✓' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
            Integrations
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Chaturbate API Key
              </label>
              <input
                type="password"
                value={chaturbateKey}
                onChange={(e) => setChaturbateKey(e.target.value)}
                placeholder="Coming soon..."
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-2">API key integration coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-red-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-red-900 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete all your streaming data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAllData}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete All Data'}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-coral hover:bg-[#e86a5a] text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
