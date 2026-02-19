/**
 * POST /api/extract-financial
 * Accepts a PDF or TXT file upload, parses it, and extracts income statement data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { parsePDF, parseTextFile } from '@/lib/pdf-parser'
import { extractFinancialData } from '@/lib/llm-extractor'
import type { ApiResponse, FinancialExtractionResult } from '@/types'

// Ensure this runs on Node.js runtime (required for pdf-parse)
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<FinancialExtractionResult>>> {
  const startTime = Date.now()

  try {
    // ── Parse multipart form data ──────────────────────────────────────────
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format. Please upload a file using multipart/form-data.',
        type: 'PARSE_ERROR',
      }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided. Please upload a PDF or TXT file.',
        type: 'PARSE_ERROR',
      }, { status: 400 })
    }

    // ── Validate file ──────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File too large. Maximum size is 10 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        type: 'FILE_TOO_LARGE',
      }, { status: 413 })
    }

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isTXT = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')

    if (!isPDF && !isTXT) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file format. Please upload a PDF (.pdf) or text (.txt) file.',
        type: 'UNSUPPORTED_FORMAT',
      }, { status: 415 })
    }

    // ── Parse document ─────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    let parsed

    try {
      parsed = isPDF ? await parsePDF(buffer) : await parseTextFile(buffer)
    } catch (parseErr) {
      console.error('Document parse error:', parseErr)
      return NextResponse.json({
        success: false,
        error: 'Failed to extract text from the document. The file may be corrupted, encrypted, or image-only (scanned PDF).',
        details: String(parseErr),
        type: 'PARSE_ERROR',
      }, { status: 422 })
    }

    if (!parsed.text || parsed.text.trim().length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract readable text from this document. If it is a scanned PDF, OCR is not yet supported.',
        type: 'PARSE_ERROR',
      }, { status: 422 })
    }

    // ── Run LLM extraction ─────────────────────────────────────────────────
    let extractionResult: FinancialExtractionResult
    try {
      extractionResult = await extractFinancialData(parsed.text, parsed.truncated)
    } catch (llmErr) {
      console.error('LLM extraction error:', llmErr)
      const errMsg = String(llmErr)
      const isApiKeyError = errMsg.includes('GROQ_API_KEY') || errMsg.includes('Invalid API Key') || errMsg.includes('401') || errMsg.includes('authentication')
      const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('Rate limit')
      return NextResponse.json({
        success: false,
        error: isApiKeyError
          ? 'API key missing or invalid. Add GROQ_API_KEY to your .env.local. Get a free key at https://console.groq.com'
          : isRateLimit
          ? 'Groq rate limit reached. Wait 60 seconds and try again (free tier: 30 req/min).'
          : 'AI extraction failed. Please try again.',
        details: errMsg,
        type: 'API_ERROR',
      }, { status: 502 })
    }

    // ── Append processing metadata ─────────────────────────────────────────
    if (parsed.truncated) {
      extractionResult.extractionNotes =
        `[Document truncated: only first ${Math.round(parsed.text.length / 1000)}K of ${Math.round(parsed.originalLength / 1000)}K characters analyzed] ` +
        extractionResult.extractionNotes
    }

    return NextResponse.json({
      success: true,
      data: extractionResult,
      processingTime: (Date.now() - startTime) / 1000,
      documentName: file.name,
    })
  } catch (err) {
    console.error('Unexpected error in /api/extract-financial:', err)
    return NextResponse.json({
      success: false,
      error: 'An unexpected server error occurred. Please try again.',
      details: String(err),
      type: 'UNKNOWN',
    }, { status: 500 })
  }
}
