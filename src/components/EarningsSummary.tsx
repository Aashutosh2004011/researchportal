'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronUp, Quote, Target, Zap, BarChart2, Info
} from 'lucide-react'
import type { EarningsAnalysisResult, OverallTone, GuidanceSpecificity } from '@/types'
import { cn } from '@/lib/utils'

interface EarningsSummaryProps {
  data: EarningsAnalysisResult
  documentName: string
  processingTime: number
}

const TONE_CONFIG: Record<OverallTone, { label: string; gradient: string; bg: string; text: string; border: string; icon: React.ElementType; emoji: string }> = {
  optimistic:  { label: 'Optimistic',  gradient: 'from-emerald-700 to-emerald-600', bg: 'bg-emerald-50',  text: 'text-emerald-800', border: 'border-emerald-300', icon: TrendingUp,   emoji: '↑' },
  cautious:    { label: 'Cautious',    gradient: 'from-amber-700 to-amber-600',     bg: 'bg-amber-50',    text: 'text-amber-800',   border: 'border-amber-300',   icon: Minus,        emoji: '~' },
  neutral:     { label: 'Neutral',     gradient: 'from-slate-700 to-slate-600',     bg: 'bg-slate-50',    text: 'text-slate-800',   border: 'border-slate-300',   icon: Minus,        emoji: '—' },
  pessimistic: { label: 'Pessimistic', gradient: 'from-rose-700 to-rose-600',       bg: 'bg-rose-50',     text: 'text-rose-800',    border: 'border-rose-300',    icon: TrendingDown, emoji: '↓' },
}

const SPECIFICITY_CONFIG: Record<GuidanceSpecificity, { label: string; color: string }> = {
  specific:      { label: 'Specific',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  vague:         { label: 'Qualitative',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
  not_mentioned: { label: 'Not Provided',  color: 'text-slate-400 bg-slate-50 border-slate-200' },
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Icon size={14} className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  )
}

function KeyPointCard({ point, supporting_quote, category, type }: {
  point: string; supporting_quote: string; category: string; type: 'positive' | 'concern'
}) {
  const isPositive = type === 'positive'
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-colors',
      isPositive ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          isPositive ? 'bg-emerald-500' : 'bg-red-500'
        )}>
          {isPositive
            ? <TrendingUp size={11} className="text-white" />
            : <TrendingDown size={11} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-sm leading-snug', isPositive ? 'text-emerald-900' : 'text-red-900')}>
            {point}
          </p>
          {supporting_quote && supporting_quote !== 'Not mentioned in document' && (
            <div className="mt-2 flex gap-2">
              <Quote size={12} className={cn('flex-shrink-0 mt-1', isPositive ? 'text-emerald-400' : 'text-red-400')} />
              <p className={cn('text-xs italic leading-relaxed', isPositive ? 'text-emerald-700' : 'text-red-700')}>
                &ldquo;{supporting_quote}&rdquo;
              </p>
            </div>
          )}
          <span className={cn(
            'mt-2 inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
            isPositive ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-red-700 bg-red-100 border-red-200'
          )}>
            {category}
          </span>
        </div>
      </div>
    </div>
  )
}

function GuidanceRow({ label, guidance, specificity }: { label: string; guidance: string; specificity: GuidanceSpecificity }) {
  const cfg = SPECIFICITY_CONFIG[specificity]
  const isEmpty = specificity === 'not_mentioned' || guidance === 'Not provided' || guidance === 'Not mentioned in document'
  return (
    <div className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="w-24 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
        <span className={cn('mt-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border', cfg.color)}>
          {cfg.label}
        </span>
      </div>
      <p className={cn('text-sm flex-1 leading-relaxed', isEmpty ? 'text-slate-400 italic' : 'text-slate-700')}>
        {guidance}
      </p>
    </div>
  )
}

export default function EarningsSummary({ data, documentName, processingTime }: EarningsSummaryProps) {
  const toneCfg = TONE_CONFIG[data.overallTone.overall]
  const ToneIcon = toneCfg.icon

  const handleExport = () => {
    const lines: string[] = [
      `AI Research Portal — Earnings Call Analysis`,
      `${'='.repeat(60)}`,
      `Company: ${data.companyName}`,
      `Period: ${data.reportPeriod}`,
      `Call Date: ${data.callDate}`,
      ``,
      `OVERALL TONE: ${data.overallTone.overall.toUpperCase()} (Confidence: ${data.overallTone.confidence})`,
      `Rationale: ${data.overallTone.rationale}`,
      ``,
      `KEY POSITIVES`,
      `${'-'.repeat(40)}`,
      ...data.keyPositives.map((p, i) => [
        `${i + 1}. ${p.point}`,
        `   "${p.supporting_quote}"`,
        `   Category: ${p.category}`,
      ].join('\n')),
      ``,
      `KEY CONCERNS`,
      `${'-'.repeat(40)}`,
      ...data.keyConcerns.map((c, i) => [
        `${i + 1}. ${c.point}`,
        `   "${c.supporting_quote}"`,
        `   Category: ${c.category}`,
      ].join('\n')),
      ``,
      `FORWARD GUIDANCE`,
      `${'-'.repeat(40)}`,
      `Revenue: ${data.forwardGuidance.revenue.guidance} [${data.forwardGuidance.revenue.specificity}]`,
      `Margin:  ${data.forwardGuidance.margin.guidance} [${data.forwardGuidance.margin.specificity}]`,
      `CapEx:   ${data.forwardGuidance.capex.guidance} [${data.forwardGuidance.capex.specificity}]`,
      ...(data.forwardGuidance.other?.map(o => `${o.topic}: ${o.guidance}`) || []),
      ``,
      `CAPACITY UTILIZATION`,
      `${'-'.repeat(40)}`,
      `Current: ${data.capacityUtilization.current}`,
      `Trend: ${data.capacityUtilization.trend}`,
      `Details: ${data.capacityUtilization.details}`,
      ``,
      `GROWTH INITIATIVES`,
      `${'-'.repeat(40)}`,
      ...data.growthInitiatives.map((g, i) => [
        `${i + 1}. ${g.name}`,
        `   ${g.description}`,
        `   Timeline: ${g.timeline} | Investment: ${g.investment}`,
      ].join('\n')),
      ``,
      `EXTRACTION NOTES`,
      `${'-'.repeat(40)}`,
      data.extractionNotes,
      ``,
      `Generated by AI Research Portal | Source: ${documentName} | ${new Date().toLocaleString()}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_EarningsAnalysis.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className={cn('rounded-2xl bg-gradient-to-r p-6 text-white shadow-sm overflow-hidden', toneCfg.gradient)}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold leading-tight">{data.companyName}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-white/80 text-sm">{data.reportPeriod}</span>
              {data.callDate && data.callDate !== 'Not specified' && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80 text-sm">{data.callDate}</span>
                </>
              )}
            </div>

            {/* Tone indicator */}
            <div className="mt-4 flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <ToneIcon size={20} className="text-white" />
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Management Tone</p>
                  <p className="font-bold text-lg text-white leading-none">{toneCfg.label}</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2.5">
                <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Confidence</p>
                <p className="font-bold text-lg text-white leading-none capitalize">{data.overallTone.confidence}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white px-4 py-2.5 rounded-xl font-semibold text-sm border border-white/20 transition-all"
          >
            Export Summary
          </button>
        </div>

        {/* Rationale */}
        <div className="mt-4 bg-black/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Tone Rationale</p>
          <p className="text-white/90 text-sm leading-relaxed">{data.overallTone.rationale}</p>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-white/50 text-xs">
          <span>Source: {documentName}</span>
          <span>•</span>
          <span>Processed in {processingTime.toFixed(1)}s</span>
        </div>
      </div>

      {/* ── Key Positives ────────────────────────────────────────────────── */}
      <Section title={`Key Positives (${data.keyPositives.length})`} icon={TrendingUp}>
        <div className="mt-4 space-y-3">
          {data.keyPositives.length === 0 ? (
            <p className="text-slate-400 italic text-sm">No key positives identified.</p>
          ) : (
            data.keyPositives.map((point, i) => (
              <KeyPointCard key={i} {...point} type="positive" />
            ))
          )}
        </div>
      </Section>

      {/* ── Key Concerns ─────────────────────────────────────────────────── */}
      <Section title={`Key Concerns (${data.keyConcerns.length})`} icon={AlertTriangle}>
        <div className="mt-4 space-y-3">
          {data.keyConcerns.length === 0 ? (
            <p className="text-slate-400 italic text-sm">No key concerns identified.</p>
          ) : (
            data.keyConcerns.map((point, i) => (
              <KeyPointCard key={i} {...point} type="concern" />
            ))
          )}
        </div>
      </Section>

      {/* ── Forward Guidance ─────────────────────────────────────────────── */}
      <Section title="Forward Guidance" icon={Target}>
        <div className="mt-4">
          <GuidanceRow label="Revenue" guidance={data.forwardGuidance.revenue.guidance} specificity={data.forwardGuidance.revenue.specificity} />
          <GuidanceRow label="Margin" guidance={data.forwardGuidance.margin.guidance} specificity={data.forwardGuidance.margin.specificity} />
          <GuidanceRow label="CapEx" guidance={data.forwardGuidance.capex.guidance} specificity={data.forwardGuidance.capex.specificity} />
          {data.forwardGuidance.other?.map((item, i) => (
            <GuidanceRow key={i} label={item.topic} guidance={item.guidance} specificity="specific" />
          ))}
        </div>
      </Section>

      {/* ── Capacity Utilization ─────────────────────────────────────────── */}
      <Section title="Capacity Utilization" icon={BarChart2}>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Level</p>
              <p className="text-slate-800 text-sm font-medium">
                {data.capacityUtilization.current === 'Not mentioned'
                  ? <span className="italic text-slate-400">Not mentioned in document</span>
                  : data.capacityUtilization.current}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Trend</p>
              <div className="flex items-center gap-2">
                {data.capacityUtilization.trend === 'improving' && <TrendingUp size={16} className="text-emerald-500" />}
                {data.capacityUtilization.trend === 'declining' && <TrendingDown size={16} className="text-red-500" />}
                {data.capacityUtilization.trend === 'stable' && <Minus size={16} className="text-blue-500" />}
                {data.capacityUtilization.trend === 'not_mentioned' && <Info size={16} className="text-slate-400" />}
                <span className={cn(
                  'text-sm font-semibold capitalize',
                  data.capacityUtilization.trend === 'improving' ? 'text-emerald-700' :
                  data.capacityUtilization.trend === 'declining' ? 'text-red-700' :
                  data.capacityUtilization.trend === 'stable' ? 'text-blue-700' :
                  'text-slate-400 italic'
                )}>
                  {data.capacityUtilization.trend === 'not_mentioned' ? 'Not mentioned' : data.capacityUtilization.trend}
                </span>
              </div>
            </div>
          </div>
          {data.capacityUtilization.details && data.capacityUtilization.details !== 'Not mentioned in document' && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Details</p>
              <p className="text-slate-700 text-sm leading-relaxed">{data.capacityUtilization.details}</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Growth Initiatives ───────────────────────────────────────────── */}
      <Section title={`Growth Initiatives (${data.growthInitiatives.length})`} icon={Zap}>
        <div className="mt-4 space-y-3">
          {data.growthInitiatives.length === 0 ? (
            <p className="text-slate-400 italic text-sm">No specific growth initiatives identified.</p>
          ) : (
            data.growthInitiatives.map((initiative, i) => (
              <div key={i} className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-indigo-900 text-sm">{initiative.name}</h4>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">{initiative.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {initiative.timeline !== 'Not specified' && (
                        <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          Timeline: {initiative.timeline}
                        </span>
                      )}
                      {initiative.investment !== 'Not specified' && (
                        <span className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          Investment: {initiative.investment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* ── Extraction Notes ─────────────────────────────────────────────── */}
      {data.extractionNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-semibold text-xs uppercase tracking-wide mb-1">Analysis Notes</p>
            <p className="text-amber-700 text-sm">{data.extractionNotes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
