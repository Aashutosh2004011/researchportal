// ─── Financial Extraction Types ───────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'missing'

export type LineItemCategory =
  | 'Revenue'
  | 'Cost'
  | 'Gross Profit'
  | 'Operating Expense'
  | 'Operating Income'
  | 'Non-Operating'
  | 'Pre-tax Income'
  | 'Tax'
  | 'Net Income'
  | 'Per Share'
  | 'Other'

export interface FinancialLineItem {
  label: string           // Exact original label from document
  standardLabel: string   // Standardized name
  category: LineItemCategory
  isTotal: boolean        // True for totals/subtotals (bold in Excel)
  values: Record<string, number | null>  // period -> value (null = missing)
  confidence: ConfidenceLevel
  notes: string
}

export interface FinancialExtractionResult {
  companyName: string
  reportType: string
  documentTitle: string
  periods: string[]         // e.g., ["FY2023", "FY2022", "FY2021"]
  currency: string          // ISO code, e.g., "USD"
  unit: string              // "billions" | "millions" | "thousands" | "actual"
  lineItems: FinancialLineItem[]
  extractionNotes: string
}

// ─── Earnings Analysis Types ──────────────────────────────────────────────────

export type OverallTone = 'optimistic' | 'cautious' | 'neutral' | 'pessimistic'
export type GuidanceSpecificity = 'specific' | 'vague' | 'not_mentioned'
export type UtilizationTrend = 'improving' | 'declining' | 'stable' | 'not_mentioned'

export interface ToneAssessment {
  overall: OverallTone
  confidence: 'high' | 'medium' | 'low'
  rationale: string
}

export interface KeyPoint {
  point: string
  supporting_quote: string
  category: string
}

export interface GuidanceItem {
  guidance: string
  specificity: GuidanceSpecificity
}

export interface ForwardGuidance {
  revenue: GuidanceItem
  margin: GuidanceItem
  capex: GuidanceItem
  other: Array<{ topic: string; guidance: string }>
}

export interface CapacityUtilization {
  current: string
  trend: UtilizationTrend
  details: string
}

export interface GrowthInitiative {
  name: string
  description: string
  timeline: string
  investment: string
}

export interface EarningsAnalysisResult {
  companyName: string
  reportPeriod: string
  callDate: string
  overallTone: ToneAssessment
  keyPositives: KeyPoint[]
  keyConcerns: KeyPoint[]
  forwardGuidance: ForwardGuidance
  capacityUtilization: CapacityUtilization
  growthInitiatives: GrowthInitiative[]
  extractionNotes: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  processingTime: number
  documentName: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
  type: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'API_ERROR' | 'PARSE_ERROR' | 'UNKNOWN'
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
