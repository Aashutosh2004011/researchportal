'use client'

import { useState } from 'react'
import { FileText, AlertCircle, RefreshCw, Info } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import LoadingState from '@/components/LoadingState'
import EarningsSummary from '@/components/EarningsSummary'
import type { EarningsAnalysisResult, ApiResponse } from '@/types'

type AppState = 'idle' | 'analyzing' | 'done' | 'error'

export default function EarningsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<EarningsAnalysisResult | null>(null)
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
      const res = await fetch('/api/analyze-earnings', {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse<EarningsAnalysisResult> = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <FileText size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Earnings Call Analysis</h1>
            <p className="text-slate-500 text-sm">AI-powered tone, guidance, and strategic insight extraction from earnings transcripts</p>
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
            hint="Best results: Full earnings call transcripts or MD&A sections with management commentary"
          />

          {/* Instructions */}
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <Info size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-700 space-y-1">
              <p><strong>What gets analyzed:</strong> Management tone, key positives, concerns, forward revenue/margin/capex guidance, capacity utilization, and growth initiatives</p>
              <p><strong>Direct quotes:</strong> Every key point is backed by a direct quote from the document — no fabrication</p>
              <p><strong>Supported formats:</strong> PDF (text-based) and .txt files. Transcripts in any format are supported.</p>
            </div>
          </div>

          {/* Analyze button */}
          {state !== 'analyzing' && (
            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              <FileText size={16} />
              {file ? `Analyze "${file.name}"` : 'Upload a document to begin'}
            </button>
          )}

          {/* Loading */}
          {state === 'analyzing' && <LoadingState toolType="earnings" />}
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
              <h3 className="font-semibold text-red-800 mb-1">Analysis Failed</h3>
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
              Analysis complete — {result.keyPositives.length} positives, {result.keyConcerns.length} concerns identified
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              <RefreshCw size={14} />
              Analyze another document
            </button>
          </div>
          <EarningsSummary
            data={result}
            documentName={file?.name || 'document'}
            processingTime={processingTime}
          />
        </>
      )}
    </div>
  )
}
