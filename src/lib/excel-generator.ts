/**
 * Professional Excel workbook generator for financial statement data.
 * Uses ExcelJS to create a multi-sheet, formatted workbook.
 */

import ExcelJS from 'exceljs'
import { FinancialExtractionResult, FinancialLineItem, ConfidenceLevel } from '@/types'
import { calcYoYGrowth, getCurrencySymbol } from '@/lib/utils'

// ─── Color Palette ─────────────────────────────────────────────────────────

const COLORS = {
  // Confidence backgrounds (ARGB)
  confHigh: 'FFD1FAE5',    // emerald-100
  confMedium: 'FFFEF3C7',  // amber-100
  confLow: 'FFFCE7D3',     // orange-100
  confMissing: 'FFFEE2E2', // red-100

  // Category header backgrounds
  catRevenue: 'FFDBEAFE',   // blue-100
  catCost: 'FFFDE8D8',      // orange-100
  catProfit: 'FFD1FAE5',    // green-100
  catExpense: 'FFFEF3C7',   // amber-100
  catIncome: 'FFE0E7FF',    // indigo-100
  catTax: 'FFF3F4F6',       // gray-100
  catOther: 'FFF9FAFB',     // gray-50

  // Total row background
  totalBg: 'FFE8EAF6',     // indigo-50
  totalFont: 'FF3730A3',   // indigo-700

  // Header background
  headerBg: 'FF1E1B4B',    // indigo-900
  headerFont: 'FFFFFFFF',  // white

  // Sub-header
  subHeaderBg: 'FF4338CA', // indigo-700
  subHeaderFont: 'FFFFFFFF',

  // Growth positive/negative
  growthPos: 'FF065F46',   // green-800
  growthNeg: 'FF9B1C1C',   // red-800

  // Borders
  borderColor: 'FFCBD5E1', // slate-300

  // Notes sheet
  notesBg: 'FFFFF7ED',     // orange-50

  white: 'FFFFFFFF',
  lightGray: 'FFF8FAFC',
  medGray: 'FFE2E8F0',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getColLetter(n: number): string {
  let result = ''
  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

function confidenceColor(c: ConfidenceLevel): string {
  return { high: COLORS.confHigh, medium: COLORS.confMedium, low: COLORS.confLow, missing: COLORS.confMissing }[c]
}

function categoryColor(category: string): string {
  if (category.toLowerCase().includes('revenue')) return COLORS.catRevenue
  if (category.toLowerCase().includes('cost')) return COLORS.catCost
  if (category.toLowerCase().includes('gross')) return COLORS.catProfit
  if (category.toLowerCase().includes('expense')) return COLORS.catExpense
  if (category.toLowerCase().includes('income') || category.toLowerCase().includes('ebit')) return COLORS.catIncome
  if (category.toLowerCase().includes('tax') || category.toLowerCase().includes('net')) return COLORS.catTax
  return COLORS.catOther
}

function applyBorder(cell: ExcelJS.Cell, style: 'thin' | 'medium' = 'thin') {
  cell.border = {
    top: { style, color: { argb: COLORS.borderColor } },
    left: { style, color: { argb: COLORS.borderColor } },
    bottom: { style, color: { argb: COLORS.borderColor } },
    right: { style, color: { argb: COLORS.borderColor } },
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateFinancialExcel(
  data: FinancialExtractionResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AI Research Portal'
  workbook.lastModifiedBy = 'AI Research Portal'
  workbook.created = new Date()

  addIncomeStatementSheet(workbook, data)
  addRawDataSheet(workbook, data)
  addNotesSheet(workbook, data)

  // Return as buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── Sheet 1: Formatted Income Statement ─────────────────────────────────────

function addIncomeStatementSheet(workbook: ExcelJS.Workbook, data: FinancialExtractionResult) {
  const ws = workbook.addWorksheet('Income Statement', {
    views: [{ state: 'frozen', ySplit: 6, xSplit: 2 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  const totalCols = 2 + data.periods.length + (data.periods.length - 1) + 1 + 1
  // Cols: [A] Category, [B] Line Item, [C..] Period Values, [YoY Growth cols], [Confidence], [Notes]

  // ── Column widths ──────────────────────────────────────────────────────────
  ws.getColumn(1).width = 22   // Category
  ws.getColumn(2).width = 38   // Line Item
  for (let i = 0; i < data.periods.length; i++) {
    ws.getColumn(3 + i).width = 16  // Period values
  }
  // YoY growth columns (one per adjacent period pair)
  for (let i = 0; i < data.periods.length - 1; i++) {
    ws.getColumn(3 + data.periods.length + i).width = 12
  }
  const confColIdx = 3 + data.periods.length + (data.periods.length - 1)
  ws.getColumn(confColIdx).width = 12      // Confidence
  ws.getColumn(confColIdx + 1).width = 40  // Notes

  const lastColLetter = getColLetter(confColIdx + 1)

  // ── Row 1: Company title ───────────────────────────────────────────────────
  ws.mergeCells(`A1:${lastColLetter}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = data.companyName
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.headerFont } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 36

  // ── Row 2: Document type & metadata ───────────────────────────────────────
  ws.mergeCells(`A2:${lastColLetter}2`)
  const metaCell = ws.getCell('A2')
  metaCell.value = `${data.reportType} | Currency: ${data.currency} | Values in: ${data.unit} | Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  metaCell.font = { size: 10, color: { argb: COLORS.headerFont }, italic: true }
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subHeaderBg } }
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 22

  // ── Row 3: Legend ──────────────────────────────────────────────────────────
  ws.mergeCells(`A3:${lastColLetter}3`)
  const legendCell = ws.getCell('A3')
  legendCell.value = 'CONFIDENCE LEGEND:   High (green) = Confirmed   Medium (yellow) = Reasonable   Low (orange) = Uncertain   Missing (red) = Not found in document'
  legendCell.font = { size: 9, color: { argb: 'FF374151' }, italic: true }
  legendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
  legendCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws.getRow(3).height = 18

  // ── Row 4: Empty spacer ────────────────────────────────────────────────────
  ws.getRow(4).height = 8

  // ── Row 5: Column headers ──────────────────────────────────────────────────
  const headerRow = ws.getRow(5)
  headerRow.height = 28

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 10, color: { argb: COLORS.headerFont } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  }

  const setHeader = (colIdx: number, value: string) => {
    const cell = headerRow.getCell(colIdx)
    cell.value = value
    Object.assign(cell, headerStyle)
    applyBorder(cell, 'medium')
  }

  setHeader(1, 'Category')
  setHeader(2, 'Line Item')
  const currSymbol = getCurrencySymbol(data.currency)
  for (let i = 0; i < data.periods.length; i++) {
    setHeader(3 + i, `${data.periods[i]}\n(${currSymbol} ${data.unit})`)
  }
  for (let i = 0; i < data.periods.length - 1; i++) {
    const yoyLabel = `YoY\n${data.periods[i]}/${data.periods[i + 1]}`
    setHeader(3 + data.periods.length + i, yoyLabel)
  }
  setHeader(confColIdx, 'Confidence')
  setHeader(confColIdx + 1, 'Notes')

  // ── Row 6: Sub-header (units reminder) ────────────────────────────────────
  ws.mergeCells(`A6:B6`)
  const unitsCell = ws.getCell('A6')
  unitsCell.value = `All values in ${data.currency} ${data.unit} unless noted`
  unitsCell.font = { size: 9, italic: true, color: { argb: 'FF6B7280' } }
  unitsCell.alignment = { horizontal: 'left', indent: 1 }
  ws.getRow(6).height = 16

  // ── Data rows ──────────────────────────────────────────────────────────────
  let currentRowIdx = 7
  let lastCategory = ''

  for (const item of data.lineItems) {
    // Category separator row
    if (item.category !== lastCategory) {
      const catRow = ws.getRow(currentRowIdx)
      catRow.height = 20
      const catMergeEnd = getColLetter(confColIdx + 1)
      ws.mergeCells(`A${currentRowIdx}:${catMergeEnd}${currentRowIdx}`)
      const catCell = catRow.getCell(1)
      catCell.value = item.category.toUpperCase()
      catCell.font = { bold: true, size: 9, color: { argb: 'FF374151' } }
      catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: categoryColor(item.category) } }
      catCell.alignment = { horizontal: 'left', indent: 1, vertical: 'middle' }
      currentRowIdx++
      lastCategory = item.category
    }

    const dataRow = ws.getRow(currentRowIdx)
    dataRow.height = 18

    const isTotal = item.isTotal
    const bgColor = isTotal ? COLORS.totalBg : confidenceColor(item.confidence)
    const fontColor = isTotal ? COLORS.totalFont : undefined
    const fontSize = isTotal ? 10 : 9

    // Col A: Category (blank for data rows — category shown in separator)
    const catCell = dataRow.getCell(1)
    catCell.value = ''
    catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    applyBorder(catCell)

    // Col B: Line item label
    const labelCell = dataRow.getCell(2)
    labelCell.value = item.standardLabel
    labelCell.font = { bold: isTotal, size: fontSize, color: fontColor ? { argb: fontColor } : undefined }
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    labelCell.alignment = { horizontal: 'left', indent: isTotal ? 1 : 3, vertical: 'middle' }
    applyBorder(labelCell)

    // Period value columns
    for (let pi = 0; pi < data.periods.length; pi++) {
      const period = data.periods[pi]
      const val = item.values[period]
      const cell = dataRow.getCell(3 + pi)

      if (val === null || val === undefined) {
        cell.value = 'N/A'
        cell.font = { italic: true, color: { argb: 'FF9CA3AF' }, size: fontSize }
      } else {
        cell.value = val
        cell.numFmt = '#,##0.0'
        cell.font = {
          bold: isTotal,
          size: fontSize,
          color: val < 0 ? { argb: 'FF991B1B' } : fontColor ? { argb: fontColor } : undefined,
        }
      }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      applyBorder(cell)
    }

    // YoY growth columns
    for (let gi = 0; gi < data.periods.length - 1; gi++) {
      const curPeriod = data.periods[gi]
      const priorPeriod = data.periods[gi + 1]
      const cur = item.values[curPeriod]
      const prior = item.values[priorPeriod]
      const growth = calcYoYGrowth(cur, prior)

      const growthCell = dataRow.getCell(3 + data.periods.length + gi)
      if (growth === null) {
        growthCell.value = 'N/A'
        growthCell.font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 9 }
      } else {
        growthCell.value = growth / 100
        growthCell.numFmt = '+0.0%;-0.0%;0.0%'
        growthCell.font = {
          size: 9,
          bold: isTotal,
          color: { argb: growth >= 0 ? COLORS.growthPos : COLORS.growthNeg },
        }
      }
      growthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
      growthCell.alignment = { horizontal: 'right', vertical: 'middle' }
      applyBorder(growthCell)
    }

    // Confidence column
    const confCell = dataRow.getCell(confColIdx)
    const confLabels: Record<ConfidenceLevel, string> = {
      high: 'High', medium: 'Medium', low: 'Low', missing: 'Missing',
    }
    confCell.value = confLabels[item.confidence]
    confCell.font = {
      size: 9,
      bold: true,
      color: {
        argb: {
          high: 'FF065F46', medium: 'FF92400E', low: 'FF9A3412', missing: 'FF991B1B',
        }[item.confidence],
      },
    }
    confCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    confCell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(confCell)

    // Notes column
    const notesCell = dataRow.getCell(confColIdx + 1)
    notesCell.value = item.notes || ''
    notesCell.font = { size: 8, italic: true, color: { argb: 'FF6B7280' } }
    notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
    notesCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    applyBorder(notesCell)

    currentRowIdx++
  }

  // ── Footer row with extraction notes ──────────────────────────────────────
  currentRowIdx++
  ws.mergeCells(`A${currentRowIdx}:${lastColLetter}${currentRowIdx}`)
  const footerCell = ws.getCell(`A${currentRowIdx}`)
  footerCell.value = `Extraction Notes: ${data.extractionNotes}`
  footerCell.font = { size: 9, italic: true, color: { argb: 'FF6B7280' } }
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.notesBg } }
  footerCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
  ws.getRow(currentRowIdx).height = 40
}

// ─── Sheet 2: Raw Extracted Data ──────────────────────────────────────────────

function addRawDataSheet(workbook: ExcelJS.Workbook, data: FinancialExtractionResult) {
  const ws = workbook.addWorksheet('Raw Data')

  ws.getColumn(1).width = 20
  ws.getColumn(2).width = 40
  ws.getColumn(3).width = 30
  ws.getColumn(4).width = 20
  ws.getColumn(5).width = 14

  const headers = ['Category', 'Original Label (from document)', 'Standard Label', 'Confidence', ...data.periods, 'Notes']
  for (let pi = 0; pi < data.periods.length; pi++) {
    ws.getColumn(5 + pi).width = 16
  }
  ws.getColumn(5 + data.periods.length).width = 50

  const headerRow = ws.getRow(1)
  headerRow.values = headers
  headerRow.height = 22
  headerRow.eachCell(cell => {
    cell.font = { bold: true, size: 10, color: { argb: COLORS.headerFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(cell, 'medium')
  })

  data.lineItems.forEach((item, idx) => {
    const row = ws.getRow(2 + idx)
    row.getCell(1).value = item.category
    row.getCell(2).value = item.label
    row.getCell(3).value = item.standardLabel
    row.getCell(4).value = item.confidence.toUpperCase()
    for (let pi = 0; pi < data.periods.length; pi++) {
      const val = item.values[data.periods[pi]]
      row.getCell(5 + pi).value = val === null ? 'N/A' : val
      if (typeof val === 'number') row.getCell(5 + pi).numFmt = '#,##0.0'
    }
    row.getCell(5 + data.periods.length).value = item.notes || ''
    row.height = 16
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      applyBorder(cell)
    })
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
      })
    }
  })
}

// ─── Sheet 3: Extraction Notes ───────────────────────────────────────────────

function addNotesSheet(workbook: ExcelJS.Workbook, data: FinancialExtractionResult) {
  const ws = workbook.addWorksheet('Extraction Report')
  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 80

  const headerRow = ws.getRow(1)
  ws.mergeCells('A1:B1')
  headerRow.getCell(1).value = 'AI Research Portal — Extraction Quality Report'
  headerRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.headerFont } }
  headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 36

  const metadata: [string, string][] = [
    ['Company', data.companyName],
    ['Document Type', data.reportType],
    ['Document Title', data.documentTitle || 'Not specified'],
    ['Periods Extracted', data.periods.join(', ')],
    ['Currency', data.currency],
    ['Units', data.unit],
    ['Total Line Items', String(data.lineItems.length)],
    ['High Confidence', String(data.lineItems.filter(i => i.confidence === 'high').length)],
    ['Medium Confidence', String(data.lineItems.filter(i => i.confidence === 'medium').length)],
    ['Low Confidence', String(data.lineItems.filter(i => i.confidence === 'low').length)],
    ['Missing Data', String(data.lineItems.filter(i => i.confidence === 'missing').length)],
    ['Extraction Notes', data.extractionNotes],
    ['Generated', new Date().toISOString()],
    ['Tool', 'AI Research Portal — Financial Statement Extractor'],
  ]

  metadata.forEach(([key, val], idx) => {
    const row = ws.getRow(2 + idx)
    row.getCell(1).value = key
    row.getCell(1).font = { bold: true, size: 10 }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? COLORS.lightGray : COLORS.white } }
    row.getCell(2).value = val
    row.getCell(2).font = { size: 10 }
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? COLORS.lightGray : COLORS.white } }
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' }
    row.height = key === 'Extraction Notes' ? 60 : 18
    applyBorder(row.getCell(1))
    applyBorder(row.getCell(2))
  })
}
