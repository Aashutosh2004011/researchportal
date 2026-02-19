'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Info, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { FinancialExtractionResult, FinancialLineItem, ConfidenceLevel } from '@/types'
import { formatFinancialValue, calcYoYGrowth, formatPct, getCurrencySymbol } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FinancialResultsProps {
  data: FinancialExtractionResult
  documentName: string
  processingTime: number
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  high:    { label: 'High',    bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  medium:  { label: 'Medium',  bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   icon: Clock },
  low:     { label: 'Low',     bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200',  icon: AlertTriangle },
  missing: { label: 'Missing', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     icon: AlertTriangle },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Revenue':          'bg-blue-50 text-blue-800 border-blue-200',
  'Cost':             'bg-orange-50 text-orange-800 border-orange-200',
  'Gross Profit':     'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Operating Expense':'bg-amber-50 text-amber-800 border-amber-200',
  'Operating Income': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Non-Operating':    'bg-slate-50 text-slate-700 border-slate-200',
  'Pre-tax Income':   'bg-purple-50 text-purple-800 border-purple-200',
  'Tax':              'bg-slate-50 text-slate-700 border-slate-200',
  'Net Income':       'bg-emerald-50 text-emerald-900 border-emerald-300',
  'Per Share':        'bg-sky-50 text-sky-800 border-sky-200',
  'Other':            'bg-gray-50 text-gray-700 border-gray-200',
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const cfg = CONFIDENCE_CONFIG[level]
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.bg, cfg.text, cfg.border)}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function GrowthIndicator({ current, prior }: { current: number | null; prior: number | null }) {
  const growth = calcYoYGrowth(current, prior)
  if (growth === null) return <span className="text-slate-400 text-xs">N/A</span>

  const isPos = growth >= 0
  const Icon = growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Minus

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isPos ? 'text-emerald-600' : 'text-red-600')}>
      <Icon size={11} />
      {formatPct(growth)}
    </span>
  )
}

export default function FinancialResults({ data, documentName, processingTime }: FinancialResultsProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const currSymbol = getCurrencySymbol(data.currency)
  const categories = [...new Set(data.lineItems.map(i => i.category))]

  // Confidence summary
  const confCounts = {
    high: data.lineItems.filter(i => i.confidence === 'high').length,
    medium: data.lineItems.filter(i => i.confidence === 'medium').length,
    low: data.lineItems.filter(i => i.confidence === 'low').length,
    missing: data.lineItems.filter(i => i.confidence === 'missing').length,
  }
  const total = data.lineItems.length

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch('/api/download-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_FinancialStatement.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setDownloadError(String(e))
    } finally {
      setDownloading(false)
    }
  }

  // Group items by category for display
  const groupedItems = categories.reduce<Record<string, FinancialLineItem[]>>((acc, cat) => {
    acc[cat] = data.lineItems.filter(i => i.category === cat)
    return acc
  }, {})

  return (
    <div className="animate-slide-up space-y-6">
      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 text-white">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">{data.companyName}</h2>
              <p className="text-indigo-200 text-sm mt-0.5">{data.reportType}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-indigo-100">
                <span className="bg-indigo-800/50 px-2 py-1 rounded-md">
                  <strong>Periods:</strong> {data.periods.join(', ')}
                </span>
                <span className="bg-indigo-800/50 px-2 py-1 rounded-md">
                  <strong>Currency:</strong> {data.currency}
                </span>
                <span className="bg-indigo-800/50 px-2 py-1 rounded-md">
                  <strong>Units:</strong> {data.unit}
                </span>
                <span className="bg-indigo-800/50 px-2 py-1 rounded-md">
                  <strong>Processed in:</strong> {processingTime.toFixed(1)}s
                </span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              {downloading ? 'Generating...' : 'Download Excel'}
            </button>
          </div>
        </div>

        {/* Confidence summary */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Quality:</span>
          {(['high', 'medium', 'low', 'missing'] as ConfidenceLevel[]).map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <ConfidenceBadge level={level} />
              <span className="text-xs text-slate-600">{confCounts[level]}/{total}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-auto">Source: {documentName}</span>
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Income Statement</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={12} />
            <span>Values in {currSymbol} {data.unit}. Hover notes for details.</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="text-left px-4 py-3 font-semibold w-8 rounded-tl-none">
                  <span className="sr-only">Category</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold">Line Item</th>
                {data.periods.map(p => (
                  <th key={p} className="text-right px-4 py-3 font-semibold min-w-[120px]">
                    {p}<br />
                    <span className="text-slate-400 text-[10px] font-normal">{currSymbol} {data.unit}</span>
                  </th>
                ))}
                {data.periods.length > 1 &&
                  data.periods.slice(0, -1).map((p, i) => (
                    <th key={`yoy-${i}`} className="text-right px-3 py-3 font-semibold text-slate-300 min-w-[80px]">
                      YoY<br />
                      <span className="text-[10px] font-normal">{p}/{data.periods[i + 1]}</span>
                    </th>
                  ))}
                <th className="text-center px-3 py-3 font-semibold min-w-[90px]">Confidence</th>
                <th className="text-left px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <>
                  {/* Category header row */}
                  <tr key={`cat-${category}`} className="border-t-2 border-slate-200">
                    <td
                      colSpan={3 + data.periods.length + (data.periods.length > 1 ? data.periods.length - 1 : 0)}
                      className="px-4 py-2"
                    >
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border',
                          CATEGORY_COLORS[category] || 'bg-gray-50 text-gray-700 border-gray-200'
                        )}
                      >
                        {category}
                      </span>
                    </td>
                  </tr>

                  {/* Line items */}
                  {groupedItems[category].map((item, idx) => (
                    <tr
                      key={`${category}-${idx}`}
                      className={cn(
                        'border-t border-slate-100 transition-colors',
                        item.isTotal
                          ? 'bg-indigo-50/70 hover:bg-indigo-100/70'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50/50 hover:bg-slate-100/50'
                      )}
                    >
                      {/* Category stripe */}
                      <td
                        className={cn(
                          'w-1 px-1',
                          item.isTotal ? 'bg-indigo-300' : 'bg-transparent'
                        )}
                      />

                      {/* Label */}
                      <td className={cn('px-4 py-2.5', item.isTotal ? 'font-bold text-indigo-900' : 'text-slate-700 pl-7')}>
                        {item.standardLabel}
                        {item.label !== item.standardLabel && (
                          <span className="text-slate-400 text-xs ml-2 font-normal italic">({item.label})</span>
                        )}
                      </td>

                      {/* Period values */}
                      {data.periods.map(period => {
                        const val = item.values[period]
                        return (
                          <td
                            key={period}
                            className={cn(
                              'px-4 py-2.5 text-right tabular-nums',
                              val === null ? 'text-slate-300 italic' : val < 0 ? 'text-red-600' : 'text-slate-800',
                              item.isTotal && 'font-bold'
                            )}
                          >
                            {val === null
                              ? <span className="text-slate-300">—</span>
                              : formatFinancialValue(val, data.unit, data.currency)
                            }
                          </td>
                        )
                      })}

                      {/* YoY growth */}
                      {data.periods.length > 1 &&
                        data.periods.slice(0, -1).map((p, i) => (
                          <td key={`yoy-${i}`} className="px-3 py-2.5 text-right">
                            <GrowthIndicator
                              current={item.values[p] ?? null}
                              prior={item.values[data.periods[i + 1]] ?? null}
                            />
                          </td>
                        ))}

                      {/* Confidence */}
                      <td className="px-3 py-2.5 text-center">
                        <ConfidenceBadge level={item.confidence} />
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[200px] truncate" title={item.notes || ''}>
                        {item.notes || ''}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Extraction Notes ─────────────────────────────────────────────── */}
      {data.extractionNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-semibold text-xs uppercase tracking-wide mb-1">Extraction Notes</p>
            <p className="text-amber-700 text-sm">{data.extractionNotes}</p>
          </div>
        </div>
      )}

      {/* ── Download Error ───────────────────────────────────────────────── */}
      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex gap-2 items-start">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>Excel download failed: {downloadError}</span>
        </div>
      )}

      {/* ── Download button (bottom) ─────────────────────────────────────── */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {downloading ? 'Generating Excel...' : 'Download as Excel (.xlsx)'}
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 max-w-xs pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
