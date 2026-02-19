'use client'

import { useState } from 'react'
import { BarChart2, AlertCircle, RefreshCw, Info } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import LoadingState from '@/components/LoadingState'
import FinancialResults from '@/components/FinancialResults'
import type { FinancialExtractionResult, ApiResponse } from '@/types'

type AppState = 'idle' | 'analyzing' | 'done' | 'error'

export default function FinancialPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<FinancialExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingTime, setProcessingTime] = useState(0)

  const handleAnalyze = async () => {
    if (!file) return

    setState('analyzing')
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/extract-financial', {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse<FinancialExtractionResult> = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Extraction failed')
      }

      setResult(data.data)
      setProcessingTime(data.processingTime)
      setState('done')
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
      setState('error')
    }
  }

  const reset = () => {
    setFile(null)
    setState('idle')
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <BarChart2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Financial Statement Extraction</h1>
            <p className="text-slate-500 text-sm">Extract income statement data into a structured, downloadable Excel file</p>
          </div>
        </div>
      </div>

      {/* ── Upload + Analysis Area ───────────────────────────────────────── */}
      {state !== 'done' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-700 text-sm mb-4">Upload Document</h2>

          <FileUpload
            onFileSelect={setFile}
            disabled={state === 'analyzing'}
            hint="Best results: Annual reports, 10-K, 10-Q filings, earnings releases with income statement data"
          />

          {/* Instructions */}
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
            <Info size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-700 space-y-1">
              <p><strong>What gets extracted:</strong> Revenue, COGS, Gross Profit, Operating Expenses (R&D, S&M, G&A, D&A), Operating Income/EBIT, Interest, Net Income, EPS</p>
              <p><strong>Supported formats:</strong> PDF (text-based) and .txt files. Scanned/image PDFs are not supported.</p>
              <p><strong>Multi-year:</strong> If your document has multiple years (e.g., FY2021, FY2022, FY2023), all will be extracted.</p>
            </div>
          </div>

          {/* Analyze button */}
          {state !== 'analyzing' && (
            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              <BarChart2 size={16} />
              {file ? `Analyze "${file.name}"` : 'Upload a document to begin'}
            </button>
          )}

          {/* Loading */}
          {state === 'analyzing' && <LoadingState toolType="financial" />}
        </div>
      )}

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Extraction Failed</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Try again with a different document
          </button>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {state === 'done' && result && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Extraction complete — {result.lineItems.length} line items found
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              <RefreshCw size={14} />
              Analyze another document
            </button>
          </div>
          <FinancialResults
            data={result}
            documentName={file?.name || 'document'}
            processingTime={processingTime}
          />
        </>
      )}
    </div>
  )
}
