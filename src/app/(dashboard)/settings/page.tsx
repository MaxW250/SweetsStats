'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, KeyRound, Lock, Sliders, Trash2, RefreshCw, CheckCircle, XCircle, Wifi } from 'lucide-react'

interface SettingsData {
  token_to_usd_rate?: number
  timezone?: string
  day_score_weights?: string
  chaturbate_api_key?: string
  chaturbate_username?: string
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
  const [chaturbateUsername, setChaturbateUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ live: boolean; viewers?: number; message?: string } | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

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
      if (data.chaturbate_username) setChaturbateUsername(data.chaturbate_username)
      if (data.day_score_weights) {
        try {
          const w = JSON.parse(data.day_score_weights)
          setWeights(w)
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const settings = [
        { key: 'token_to_usd_rate', value: tokenRate },
        { key: 'timezone', value: timezone },
        { key: 'day_score_weights', value: JSON.stringify(weights) },
        { key: 'chaturbate_api_key', value: chaturbateKey },
        { key: 'chaturbate_username', value: chaturbateUsername },
      ]
      for (const setting of settings) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        })
      }
      showMessage('Settings saved!', 'success')
    } catch (error) {
      showMessage('Failed to save settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error')
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
        showMessage('Password changed! Redirecting to login...', 'success')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        showMessage('Failed to change password', 'error')
      }
    } catch {
      showMessage('Failed to change password', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNow = async () => {
    if (!chaturbateUsername) {
      showMessage('Enter your Chaturbate username first', 'error')
      return
    }
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/chaturbate/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: chaturbateUsername, apiKey: chaturbateKey }),
      })
      const data = await response.json()
      setSyncResult(data)
      if (data.error) {
        showMessage(data.error, 'error')
      } else {
        showMessage(
          data.live
            ? `She's live! ${data.viewers ?? 0} viewers. Session logged.`
            : 'Not currently live.',
          data.live ? 'success' : 'error'
        )
      }
    } catch {
      showMessage('Sync failed — check your settings', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure? This action cannot be undone!')) return
    setLoading(true)
    try {
      const tables = ['stream_sessions', 'daily_earnings', 'tippers']
      for (const table of tables) {
        await fetch(`/api/${table}`, { method: 'DELETE' })
      }
      showMessage('All data deleted', 'success')
    } catch {
      showMessage('Failed to delete data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalWeight = weights.usd + weights.tips + weights.viewers + weights.followers

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your dashboard preferences</p>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-100'
              : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Chaturbate Integration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <Wifi size={16} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Chaturbate Integration</h3>
            <p className="text-xs text-gray-400">Auto-log sessions when you go live</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Chaturbate Username
            </label>
            <input
              type="text"
              value={chaturbateUsername}
              onChange={(e) => setChaturbateUsername(e.target.value)}
              placeholder="e.g. your_model_name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Affiliate / Tracking Code (optional)
            </label>
            <input
              type="password"
              value={chaturbateKey}
              onChange={(e) => setChaturbateKey(e.target.value)}
              placeholder="Your CB affiliate/wm code"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Used to access the Chaturbate affiliates API. If you don't have one, the public API will be used.
            </p>
          </div>

          {/* Sync result badge */}
          {syncResult !== null && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                syncResult.live
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${syncResult.live ? 'bg-green-500' : 'bg-gray-400'}`} />
              {syncResult.live
                ? `Currently live · ${syncResult.viewers ?? 0} viewers`
                : 'Not currently live'}
            </div>
          )}

          <button
            onClick={handleSyncNow}
            disabled={syncing || !chaturbateUsername}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Checking...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Earnings Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#F0FFF4] flex items-center justify-center">
            <Sliders size={16} style={{ color: '#22C55E' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Earnings Settings</h3>
            <p className="text-xs text-gray-400">Token conversion and timezone</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Token to USD Rate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.001"
                value={tokenRate}
                onChange={(e) => setTokenRate(parseFloat(e.target.value))}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">USD per token</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            >
              <option>UTC</option>
              <option>America/New_York</option>
              <option>America/Chicago</option>
              <option>America/Denver</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
              <option>Europe/Paris</option>
              <option>Europe/Amsterdam</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Day Score Weights */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Sliders size={16} style={{ color: '#6366F1' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Day Score Weights</h3>
            <p className="text-xs text-gray-400">How much each metric counts toward your day score</p>
          </div>
        </div>

        <div className="space-y-4">
          {(['usd', 'tips', 'viewers', 'followers'] as const).map((key) => (
            <div key={key}>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {key}
                </label>
                <span className="text-xs font-semibold text-gray-900">{Math.round(weights[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights[key]}
                onChange={(e) => setWeights({ ...weights, [key]: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
            </div>
          ))}

          <div
            className={`flex items-center justify-between p-3 rounded-xl text-sm ${
              Math.abs(totalWeight - 1) < 0.01
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span className="font-medium">Total weight</span>
            <span className="font-semibold">
              {Math.round(totalWeight * 100)}%
              {Math.abs(totalWeight - 1) < 0.01 ? ' ✓' : ' (should be 100%)'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
            <Lock size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-400">Update your dashboard login password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            <KeyRound size={14} />
            Change Password
          </button>
        </div>
      </div>

      {/* Save Settings */}
      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl disabled:opacity-50 transition-colors"
      >
        <Save size={16} />
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 size={16} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            <p className="text-xs text-red-400">Permanently delete all streaming data</p>
          </div>
        </div>
        <button
          onClick={handleDeleteAllData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
        >
          <Trash2 size={14} />
          Delete All Data
        </button>
      </div>
    </div>
  )
}
