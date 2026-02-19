import Link from 'next/link'
import { BarChart2, FileText, ArrowRight, CheckCircle2, Zap, Shield } from 'lucide-react'

const tools = [
  {
    href: '/financial',
    icon: BarChart2,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    accentColor: 'border-indigo-500',
    tag: 'Option A',
    tagColor: 'bg-indigo-100 text-indigo-700',
    title: 'Financial Statement Extraction',
    description: 'Extract income statement line items from annual reports and financial statements into structured Excel.',
    features: [
      'Multi-year income statement extraction',
      'Revenue, expenses, EBIT, EPS & more',
      'Confidence scoring per line item',
      'YoY growth calculations',
      'Professional 3-sheet Excel export',
      'Handles varied formatting & naming',
    ],
    inputLabel: 'Input',
    input: 'Annual Report, 10-K, 10-Q, Earnings Release (PDF or TXT)',
    outputLabel: 'Output',
    output: 'Formatted Excel with income statement, raw data, and quality report',
  },
  {
    href: '/earnings',
    icon: FileText,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accentColor: 'border-emerald-500',
    tag: 'Option B',
    tagColor: 'bg-emerald-100 text-emerald-700',
    title: 'Earnings Call Analysis',
    description: 'Analyze earnings call transcripts and MD&A sections for tone, guidance, and strategic insights.',
    features: [
      'Management tone & sentiment assessment',
      '3–5 key positives with direct quotes',
      '3–5 key concerns with direct quotes',
      'Forward guidance (revenue, margin, capex)',
      'Capacity utilization trend analysis',
      '2–3 growth initiatives identified',
    ],
    inputLabel: 'Input',
    input: 'Earnings call transcript, MD&A, management commentary (PDF or TXT)',
    outputLabel: 'Output',
    output: 'Structured analyst report with tone, guidance, and growth initiatives',
  },
]

const highlights = [
  {
    icon: Shield,
    title: 'No Hallucination',
    description: 'Every data point is anchored to your document. Missing data is clearly flagged, never fabricated.',
  },
  {
    icon: Zap,
    title: 'Fast & Accurate',
    description: 'Powered by Claude claude-sonnet-4-5-20250929 — handles complex financial tables and unstructured text.',
  },
  {
    icon: CheckCircle2,
    title: 'Analyst-Ready',
    description: 'Outputs include confidence scoring, YoY growth, direct quotes, and clean Excel formatting.',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <Zap size={13} />
          Powered by Llama 3.3 70B via Groq
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI Research Portal
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Upload a document and get structured, analyst-ready insights in seconds.
          No hallucinations. No fluff. Just reliable data extraction.
        </p>
      </div>

      {/* ── Feature Highlights ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {highlights.map(({ icon: Icon, title, description }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tool Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group bg-white rounded-2xl border-2 border-slate-200 hover:${tool.accentColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
            >
              <div className="p-6 flex-1">
                {/* Tag & Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center shadow-sm`}>
                    <Icon size={22} className={tool.iconColor} />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tool.tagColor}`}>
                    {tool.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{tool.description}</p>

                {/* Features */}
                <ul className="mt-4 space-y-1.5">
                  {tool.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Input/Output */}
                <div className="mt-5 space-y-2">
                  <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-wide">Input: </span>
                    <span className="text-slate-600">{tool.input}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-wide">Output: </span>
                    <span className="text-slate-600">{tool.output}</span>
                  </div>
                </div>
              </div>

              {/* CTA footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Open Tool</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-amber-700 text-xs leading-relaxed">
          <strong>Important:</strong> This tool uses AI to extract and analyze financial data.
          All outputs should be verified against the original source document before use in investment decisions.
          Missing data is explicitly flagged and never estimated or fabricated.
        </p>
      </div>
    </div>
  )
}
