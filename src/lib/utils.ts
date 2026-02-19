import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency/financial value
 */
export function formatFinancialValue(
  value: number | null,
  unit: string,
  currency: string
): string {
  if (value === null) return 'N/A'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '(' : ''
  const end = value < 0 ? ')' : ''

  let formatted: string
  if (unit === 'billions') {
    formatted = absValue.toFixed(1) + 'B'
  } else if (unit === 'millions') {
    formatted = absValue.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  } else if (unit === 'thousands') {
    formatted = absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  } else {
    formatted = absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const currencySymbol = getCurrencySymbol(currency)
  return `${sign}${currencySymbol}${formatted}${end}`
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹',
    CAD: 'C$', AUD: 'A$', CHF: 'Fr', CNY: '¥', KRW: '₩',
  }
  return symbols[currency?.toUpperCase()] ?? currency + ' '
}

/**
 * Calculate Year-over-Year growth percentage
 */
export function calcYoYGrowth(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

/**
 * Format percentage
 */
export function formatPct(value: number | null, decimals = 1): string {
  if (value === null) return 'N/A'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Truncate text to fit context window while preserving structure
 */
export function truncateText(text: string, maxChars = 80000): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false }
  // Try to cut at a natural paragraph boundary
  const truncated = text.slice(0, maxChars)
  const lastNewline = truncated.lastIndexOf('\n\n')
  return {
    text: lastNewline > maxChars * 0.8 ? truncated.slice(0, lastNewline) : truncated,
    truncated: true,
  }
}

/**
 * Safely parse JSON from LLM output (strips markdown code fences if present)
 */
export function safeParseJSON<T>(raw: string): T {
  // Remove markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  return JSON.parse(cleaned) as T
}
