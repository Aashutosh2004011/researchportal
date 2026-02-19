/**
 * LLM-powered extraction using Groq (free tier).
 * Model: llama-3.3-70b-versatile — 128K context, excellent for financial docs.
 *
 * Get a FREE API key at: https://console.groq.com
 * No credit card required — just create an account.
 * Free limits: 6,000 requests/day, 14,400 tokens/min
 */

import Groq from 'groq-sdk'
import { FinancialExtractionResult, EarningsAnalysisResult } from '@/types'
import { safeParseJSON } from '@/lib/utils'

// llama-3.3-70b-versatile: 128K context, best quality on free tier
// Alternative: llama-3.1-8b-instant (faster, lower limits)
const MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Get a free key at https://console.groq.com — no credit card needed.'
    )
  }
  return new Groq({ apiKey })
}

// ─── Financial Statement Extraction ──────────────────────────────────────────

const FINANCIAL_SYSTEM_PROMPT = `You are an expert financial analyst and data extraction specialist. Your sole task is to extract income statement data from document text and return a structured JSON object.

EXTRACTION RULES — FOLLOW STRICTLY:
1. ONLY extract values explicitly present in the document. NEVER fabricate, estimate, or infer.
2. If a value is not found or unclear, set it to null and note it.
3. Preserve exact original numeric values — do not convert units or currencies.
4. Parenthetical values like (1,234) indicate negatives — store as negative numbers.
5. Identify currency (USD/EUR/GBP/INR/etc.) and units (billions/millions/thousands/actual) from context.
6. Extract ALL time periods present (fiscal years, quarters, half-years).
7. Assign confidence: "high" = clear & unambiguous, "medium" = reasonable certainty, "low" = uncertain, "missing" = not found.
8. Set isTotal=true for summary rows (Total Revenue, Gross Profit, Operating Income, Net Income, etc.).

STANDARD INCOME STATEMENT STRUCTURE TO LOOK FOR:
• REVENUE: Net Revenue, Total Revenue, Net Sales, Revenue by segment
• COST: COGS, Cost of Sales, Cost of Revenue, Cost of Products/Services
• GROSS PROFIT: Gross Profit, Gross Income
• OPERATING EXPENSES: R&D, Research & Development, S&M / Sales & Marketing, G&A / General & Administrative, D&A / Depreciation & Amortization, Impairment, Restructuring, Other OpEx
• OPERATING INCOME: Operating Income/Loss, Operating Profit, EBIT
• NON-OPERATING: Interest Expense, Interest Income, Other Income/Expense
• PRE-TAX: Income Before Tax, Pre-tax Income, EBT
• TAX: Income Tax Expense/Benefit, Provision for Income Taxes
• NET INCOME: Net Income/Loss, Net Earnings, Profit for the Period
• PER SHARE: EPS Basic, EPS Diluted, Shares Outstanding Basic/Diluted
• ALSO: EBITDA, Adjusted EBITDA, Non-GAAP metrics if present

NOTE: PDF text extraction may not preserve table formatting. Identify financial data from context and numeric patterns even if alignment is lost.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation — raw JSON only.`

const FINANCIAL_USER_TEMPLATE = (text: string, truncated: boolean) => `
${truncated ? 'NOTE: This document was truncated to fit context limits. Only the first portion is analyzed.\n\n' : ''}Extract all income statement data from the following document text and return ONLY a JSON object (no markdown, no code fences):

---DOCUMENT START---
${text}
---DOCUMENT END---

Return this exact JSON structure:
{
  "companyName": "Company name from document",
  "reportType": "Annual Report | 10-K | 10-Q | Earnings Release | MD&A | etc.",
  "documentTitle": "Document title if visible",
  "periods": ["FY2023", "FY2022"],
  "currency": "USD",
  "unit": "millions",
  "lineItems": [
    {
      "label": "Exact original label from document",
      "standardLabel": "Standardized label",
      "category": "Revenue | Cost | Gross Profit | Operating Expense | Operating Income | Non-Operating | Pre-tax Income | Tax | Net Income | Per Share | Other",
      "isTotal": false,
      "values": { "FY2023": 12345.6, "FY2022": null },
      "confidence": "high | medium | low | missing",
      "notes": "Extraction notes or empty string"
    }
  ],
  "extractionNotes": "Overall notes on document quality, structure, completeness"
}`

// ─── Earnings Call Analysis ───────────────────────────────────────────────────

const EARNINGS_SYSTEM_PROMPT = `You are an expert financial analyst specializing in earnings call analysis and management commentary evaluation.

ANALYSIS RULES — FOLLOW STRICTLY:
1. Base ALL analysis ONLY on content explicitly in the document. NEVER fabricate.
2. Use direct, concise quotes (max 2 sentences) to support each key point.
3. Tone assessment: analyze word choice, hedging language, confidence, framing.
4. For guidance specificity: "specific" = has numbers/ranges, "vague" = directional only, "not_mentioned" = absent.
5. If a section has no relevant content, use exactly: "Not mentioned in document".
6. Limit keyPositives and keyConcerns to the 3–5 most impactful points.
7. Only include concrete named growth initiatives — not vague "continued investment" statements.

TONE GUIDE:
• optimistic: Strong positive language, beating expectations, record results, confidence in growth
• cautious: Hedging language, uncertainty, acknowledging headwinds, "monitoring closely"
• neutral: Balanced, meeting expectations, steady state language
• pessimistic: Negative language, missing guidance, deteriorating conditions, cost-cutting focus

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation — raw JSON only.`

const EARNINGS_USER_TEMPLATE = (text: string, truncated: boolean) => `
${truncated ? 'NOTE: Document was truncated to fit context limits. Only the first portion is analyzed.\n\n' : ''}Analyze the following earnings call transcript or management commentary and return ONLY a JSON object (no markdown, no code fences):

---DOCUMENT START---
${text}
---DOCUMENT END---

Return this exact JSON structure:
{
  "companyName": "Company name",
  "reportPeriod": "Q4 FY2024 / FY2023 / etc.",
  "callDate": "Date if found, else 'Not specified'",
  "overallTone": {
    "overall": "optimistic | cautious | neutral | pessimistic",
    "confidence": "high | medium | low",
    "rationale": "2-3 sentence explanation with specific evidence"
  },
  "keyPositives": [
    {
      "point": "Concise 1-sentence description",
      "supporting_quote": "Direct quote (max 2 sentences)",
      "category": "Revenue Growth | Margin Expansion | Market Share | New Product | Cost Reduction | Geographic Expansion | Strategic Win | Other"
    }
  ],
  "keyConcerns": [
    {
      "point": "Concise 1-sentence description",
      "supporting_quote": "Direct quote (max 2 sentences)",
      "category": "Revenue Pressure | Margin Compression | Competition | Macro Headwind | Execution Risk | Regulatory | Other"
    }
  ],
  "forwardGuidance": {
    "revenue": { "guidance": "Guidance text or 'Not provided'", "specificity": "specific | vague | not_mentioned" },
    "margin": { "guidance": "Guidance text or 'Not provided'", "specificity": "specific | vague | not_mentioned" },
    "capex": { "guidance": "Guidance text or 'Not provided'", "specificity": "specific | vague | not_mentioned" },
    "other": [{ "topic": "Topic name", "guidance": "Guidance text" }]
  },
  "capacityUtilization": {
    "current": "Current utilization rate/description or 'Not mentioned'",
    "trend": "improving | declining | stable | not_mentioned",
    "details": "Additional context and supporting quotes"
  },
  "growthInitiatives": [
    {
      "name": "Initiative name",
      "description": "1-2 sentence description",
      "timeline": "Timeline if mentioned, else 'Not specified'",
      "investment": "Investment amount if mentioned, else 'Not specified'"
    }
  ],
  "extractionNotes": "Notes on document quality, completeness, limitations"
}`

// ─── Main Extraction Functions ────────────────────────────────────────────────

export async function extractFinancialData(
  text: string,
  truncated: boolean
): Promise<FinancialExtractionResult> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      { role: 'user', content: FINANCIAL_USER_TEMPLATE(text, truncated) },
    ],
    max_tokens: 8192,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? ''
  if (!raw) throw new Error('Empty response from Groq API')

  try {
    return safeParseJSON<FinancialExtractionResult>(raw)
  } catch {
    throw new Error(`Failed to parse financial extraction result: ${raw.slice(0, 300)}`)
  }
}

export async function analyzeEarningsCall(
  text: string,
  truncated: boolean
): Promise<EarningsAnalysisResult> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: EARNINGS_SYSTEM_PROMPT },
      { role: 'user', content: EARNINGS_USER_TEMPLATE(text, truncated) },
    ],
    max_tokens: 8192,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? ''
  if (!raw) throw new Error('Empty response from Groq API')

  try {
    return safeParseJSON<EarningsAnalysisResult>(raw)
  } catch {
    throw new Error(`Failed to parse earnings analysis result: ${raw.slice(0, 300)}`)
  }
}
