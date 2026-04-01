'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { SessionForm } from '@/components/forms/SessionForm'
import { EarningsForm } from '@/components/forms/EarningsForm'
import { TipperForm } from '@/components/forms/TipperForm'

type ImportTab = 'manual' | 'csv' | 'airtable'
type ManualTab = 'session' | 'earnings' | 'tipper'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('manual')
  const [activeManualTab, setActiveManualTab] = useState<ManualTab>('session')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<unknown[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data as unknown[])
      },
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
          Import Data
        </h1>
        <p className="text-gray-600 mt-2">Add data to your dashboard</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'manual'
              ? 'text-coral border-coral'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'csv'
              ? 'text-coral border-coral'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          CSV Upload
        </button>
        <button
          onClick={() => setActiveTab('airtable')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'airtable'
              ? 'text-coral border-coral'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Airtable Sync
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="flex gap-2 bg-gray-50 p-4 rounded-lg">
            <button
              onClick={() => setActiveManualTab('session')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeManualTab === 'session'
                  ? 'bg-coral text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              Session
            </button>
            <button
              onClick={() => setActiveManualTab('earnings')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeManualTab === 'earnings'
                  ? 'bg-coral text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => setActiveManualTab('tipper')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeManualTab === 'tipper'
                  ? 'bg-coral text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              Tipper
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeManualTab === 'session' && <SessionForm />}
            {activeManualTab === 'earnings' && <EarningsForm />}
            {activeManualTab === 'tipper' && <TipperForm />}
          </div>
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-900 block mb-2">
                Choose CSV File
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-coral file:text-white
                  hover:file:bg-[#e86a5a]"
              />
            </label>

            {csvData.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0] as Record<string, unknown>).map((key) => (
                            <th key={key} className="px-4 py-2 text-left font-medium text-gray-900">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          {Object.values(row as Record<string, unknown>).map((val, cidx) => (
                            <td key={cidx} className="px-4 py-2 text-gray-700">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'airtable' && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-xl text-gray-900 font-serif font-bold">Coming Soon</p>
          <p className="text-gray-600 mt-2">
            Airtable integration is coming soon. Sync your data directly from Airtable.
          </p>
        </div>
      )}
    </div>
  )
}
