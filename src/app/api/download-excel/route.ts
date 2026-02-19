/**
 * POST /api/download-excel
 * Accepts FinancialExtractionResult JSON and returns a formatted .xlsx file.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateFinancialExcel } from '@/lib/excel-generator'
import type { FinancialExtractionResult } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    let data: FinancialExtractionResult
    try {
      data = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    if (!data || !data.companyName || !data.lineItems) {
      return NextResponse.json({ error: 'Missing required financial data fields.' }, { status: 400 })
    }

    const excelBuffer = await generateFinancialExcel(data)
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(excelBuffer)

    const safeName = data.companyName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
    const filename = `${safeName}_FinancialStatement.xlsx`

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(uint8Array.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Excel generation error:', err)
    return NextResponse.json({
      error: 'Failed to generate Excel file.',
      details: String(err),
    }, { status: 500 })
  }
}
