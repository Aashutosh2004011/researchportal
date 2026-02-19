/**
 * POST /api/analyze-earnings
 * Accepts a PDF or TXT earnings call transcript and returns structured analysis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { parsePDF, parseTextFile } from '@/lib/pdf-parser'
import { analyzeEarningsCall } from '@/lib/anthropic-extractor'
import type { ApiResponse, EarningsAnalysisResult } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<EarningsAnalysisResult>>> {
  const startTime = Date.now()

  try {
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

    const buffer = Buffer.from(await file.arrayBuffer())
    let parsed

    try {
      parsed = isPDF ? await parsePDF(buffer) : await parseTextFile(buffer)
    } catch (parseErr) {
      console.error('Document parse error:', parseErr)
      return NextResponse.json({
        success: false,
        error: 'Failed to extract text from the document. The file may be corrupted, encrypted, or image-only.',
        details: String(parseErr),
        type: 'PARSE_ERROR',
      }, { status: 422 })
    }

    if (!parsed.text || parsed.text.trim().length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract readable text from this document.',
        type: 'PARSE_ERROR',
      }, { status: 422 })
    }

    let analysisResult: EarningsAnalysisResult
    try {
      analysisResult = await analyzeEarningsCall(parsed.text, parsed.truncated)
    } catch (llmErr) {
      console.error('LLM analysis error:', llmErr)
      const errMsg = String(llmErr)
      const isApiKeyError = errMsg.includes('GROQ_API_KEY') || errMsg.includes('Invalid API Key') || errMsg.includes('401') || errMsg.includes('authentication')
      const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('Rate limit')
      return NextResponse.json({
        success: false,
        error: isApiKeyError
          ? 'API key missing or invalid. Add GROQ_API_KEY to your .env.local. Get a free key at https://console.groq.com'
          : isRateLimit
          ? 'Groq rate limit reached. Wait 60 seconds and try again (free tier: 30 req/min).'
          : 'AI analysis failed. Please try again.',
        details: errMsg,
        type: 'API_ERROR',
      }, { status: 502 })
    }

    if (parsed.truncated) {
      analysisResult.extractionNotes =
        `[Document truncated: only first ${Math.round(parsed.text.length / 1000)}K of ${Math.round(parsed.originalLength / 1000)}K characters analyzed] ` +
        analysisResult.extractionNotes
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
      processingTime: (Date.now() - startTime) / 1000,
      documentName: file.name,
    })
  } catch (err) {
    console.error('Unexpected error in /api/analyze-earnings:', err)
    return NextResponse.json({
      success: false,
      error: 'An unexpected server error occurred. Please try again.',
      details: String(err),
      type: 'UNKNOWN',
    }, { status: 500 })
  }
}
