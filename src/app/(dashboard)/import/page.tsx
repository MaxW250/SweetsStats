'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { SessionForm } from '@/components/forms/SessionForm'
import { EarningsForm } from '@/components/forms/EarningsForm'
import { TipperForm } from '@/components/forms/TipperForm'
import { Card, CardBody, Button } from '@heroui/react'
import { Upload, CheckCircle, AlertCircle, UserPlus, ChevronDown } from 'lucide-react'

type ImportTab = 'manual' | 'csv'
type ManualTab = 'session' | 'earnings' | 'tipper'
type DataType = 'sessions' | 'earnings' | 'tippers'

const DATA_TYPE_OPTIONS: { key: DataType; label: string; endpoint: string }[] = [
  { key: 'sessions', label: 'Stream Sessions', endpoint: '/api/sessions' },
  { key: 'earnings', label: 'Daily Earnings', endpoint: '/api/earnings' },
  { key: 'tippers', label: 'Tippers', endpoint: '/api/tippers' },
]

// Quick-add tipper inline widget shown under the Session form
function QuickAddTipper() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [tokens, setTokens] = useState('')
  const [usd, setUsd] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    if (!username.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tippers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          total_tokens_all_time: tokens ? parseInt(tokens) : 0,
          total_usd_all_time: usd ? parseFloat(usd) : 0,
          number_of_tips: 1,
          biggest_single_tip_tokens: tokens ? parseInt(tokens) : 0,
          biggest_single_tip_usd: usd ? parseFloat(usd) : 0,
        }),
      })
      if (res.ok) {
        setMsg(`Tipper "${username.trim()}" saved!`)
        setUsername('')
        setTokens('')
        setUsd('')
        setTimeout(() => setMsg(''), 4000)
      } else {
        const err = await res.json()
        setMsg(`Error: ${err.error ?? 'Failed to save'}`)
        setTimeout(() => setMsg(''), 5000)
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand transition-colors"
      >
        <UserPlus size={15} />
        <span>Also add a tipper?</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400">Quickly log a tipper from this session. Username is required.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cooltipper42"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tokens</label>
              <input
                type="number"
                min={0}
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">USD</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !username.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              <UserPlus size={14} />
              {saving ? 'Saving...' : 'Save tipper'}
            </button>
            {msg && (
              <span className={`text-xs font-medium ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {msg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ImportTab>('manual')
  const [activeManualTab, setActiveManualTab] = useState<ManualTab>('session')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [dataType, setDataType] = useState<DataType>('sessions')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setImportResult(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data)
      },
    })
  }

  const handleImport = async () => {
    if (!csvData.length) return
    setIsImporting(true)
    setImportResult(null)

    const endpoint = DATA_TYPE_OPTIONS.find((o) => o.key === dataType)?.endpoint
    if (!endpoint) return

    let successCount = 0
    let errorCount = 0

    const batchSize = 10
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (row) => {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(row),
            })
            if (res.ok) { successCount++ } else { errorCount++ }
          } catch { errorCount++ }
        })
      )
    }

    setImportResult({ success: successCount, errors: errorCount })
    setIsImporting(false)

    if (successCount > 0) { router.refresh() }
  }

  const resetCSV = () => {
    setCsvFile(null)
    setCsvData([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
          Import Data
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Add data to your dashboard</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'csv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          CSV Upload
        </button>
      </div>

      {/* Manual Entry */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['session', 'earnings', 'tipper'] as ManualTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveManualTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeManualTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'session' ? 'Session' : tab === 'earnings' ? 'Earnings' : 'Tipper'}
              </button>
            ))}
          </div>

          <Card className="border border-gray-100 shadow-none" radius="lg">
            <CardBody className="p-6">
              {activeManualTab === 'session' && (
                <>
                  <SessionForm />
                  <QuickAddTipper />
                </>
              )}
              {activeManualTab === 'earnings' && <EarningsForm />}
              {activeManualTab === 'tipper' && <TipperForm />}
            </CardBody>
          </Card>
        </div>
      )}

      {/* CSV Upload */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          <Card className="border border-gray-100 shadow-none" radius="lg">
            <CardBody className="p-6 space-y-5">

              {/* Data type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of data is in this CSV?
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as DataType)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose CSV file
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[#1d4ed8] transition-colors">
                    <Upload size={16} />
                    {csvFile ? 'Change file' : 'Choose file'}
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </label>
                  {csvFile && (
                    <span className="text-sm text-gray-600 truncate max-w-xs">{csvFile.name}</span>
                  )}
                </div>
              </div>

              {/* Preview */}
              {csvData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Preview — {csvData.length} rows detected
                    </p>
                    <button onClick={resetCSV} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Clear
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {Object.keys(csvData[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                            {Object.values(row).map((val, cidx) => (
                              <td key={cidx} className="px-3 py-2 text-gray-700 whitespace-nowrap">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.length > 5 && (
                    <p className="text-xs text-gray-400 mt-2">Showing 5 of {csvData.length} rows</p>
                  )}
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className={`flex items-center gap-3 p-4 rounded-lg text-sm ${
                  importResult.errors === 0
                    ? 'bg-green-50 text-green-800 border border-green-100'
                    : 'bg-amber-50 text-amber-800 border border-amber-100'
                }`}>
                  {importResult.errors === 0 ? (
                    <CheckCircle size={18} className="text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {importResult.success} row{importResult.success !== 1 ? 's' : ''} imported successfully
                      {importResult.errors > 0 && `, ${importResult.errors} failed`}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              {csvData.length > 0 && (
                <Button
                  onPress={handleImport}
                  isLoading={isImporting}
                  className="bg-brand text-white font-medium w-full md:w-auto px-8"
                  radius="lg"
                  size="md"
                >
                  {isImporting
                    ? 'Importing...'
                    : `Import ${csvData.length} row${csvData.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
