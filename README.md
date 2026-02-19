# AI Research Portal

A professional document analysis portal with two AI-powered research tools, built with Next.js 15 + Claude claude-sonnet-4-5-20250929.

## Tools

### Option A — Financial Statement Extraction
Upload an annual report, 10-K, or earnings release and extract income statement line items into a professionally formatted Excel file.

**Output includes:**
- Revenue, COGS, Gross Profit, Operating Expenses (R&D, S&M, G&A, D&A)
- Operating Income/EBIT, Interest, Pre-tax Income, Net Income, EPS
- Multi-year data with YoY growth calculations
- Confidence scoring per line item (High/Medium/Low/Missing)
- 3-sheet Excel: formatted income statement, raw data, extraction quality report

### Option B — Earnings Call Analysis
Upload an earnings call transcript or MD&A section and get a structured analysis.

**Output includes:**
- Management tone assessment (Optimistic/Cautious/Neutral/Pessimistic) with confidence level
- 3–5 key positives with direct supporting quotes
- 3–5 key concerns/challenges with direct supporting quotes
- Forward guidance (revenue, margin, capex) with specificity indicator
- Capacity utilization trend
- 2–3 identified growth initiatives with timelines and investment details
- Exportable text summary

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| LLM | Google Gemini 2.0 Flash (free tier) |
| PDF Parsing | pdf-parse |
| Excel Generation | ExcelJS |
| File Upload UI | react-dropzone |
| Deployment | Vercel |

## Local Setup

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone/navigate to project
cd research-portal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# 4. Start development server
npm run dev

# Open http://localhost:3000
```

## Deploy to Vercel

### One-click deploy (recommended)

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your key
4. Click Deploy

### CLI deploy

```bash
npm install -g vercel
vercel --prod
# When prompted, add ANTHROPIC_API_KEY as an environment variable
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Free Google Gemini key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — no credit card |
| `GEMINI_MODEL` | No | Override model (default: `gemini-2.0-flash`). Other free options: `gemini-1.5-flash` |

## Limitations & Notes

- **File size limit:** 10 MB per upload
- **Supported formats:** PDF (text-based) and .txt only. Scanned/image PDFs are not supported (no OCR).
- **Processing time:** 15–30 seconds per document on typical documents
- **Context window:** Very large documents (>100K characters) are truncated to fit the model's context. The extraction notes will indicate if truncation occurred.
- **Vercel free tier:** Functions have a 60-second timeout. Very large or complex documents may occasionally time out.
- **Data accuracy:** All extractions are grounded in the document. Missing data is flagged as "N/A" / "Missing" — never fabricated.

## Key Design Decisions

**Financial Extraction:**
- Used Claude claude-sonnet-4-5-20250929's strong reasoning to handle varied table formats (PDF text extraction destroys table structure; Claude reconstructs it)
- Each line item gets a confidence score so analysts can spot uncertain extractions at a glance
- Original document labels preserved alongside standardized labels (e.g., "Operating costs" → "Operating Expenses")
- Negative values (presented as parenthetical in documents) correctly stored as negative numbers
- Multiple years extracted simultaneously with YoY growth auto-calculated in Excel

**Earnings Analysis:**
- Tone assessment based on linguistic cues, not just keyword counting
- Every key point anchored to a direct quote — zero hallucination
- Guidance specificity indicator (Specific/Qualitative/Not Provided) helps analysts quickly assess management confidence
- Capacity utilization extracted even when mentioned incidentally in the transcript

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page with tool selection
│   ├── financial/page.tsx          # Financial extraction tool
│   ├── earnings/page.tsx           # Earnings analysis tool
│   └── api/
│       ├── extract-financial/      # PDF → structured financial JSON
│       ├── analyze-earnings/       # PDF → earnings analysis JSON
│       └── download-excel/         # JSON → .xlsx file
├── components/
│   ├── Header.tsx                  # Navigation
│   ├── FileUpload.tsx              # Drag-and-drop upload
│   ├── FinancialResults.tsx        # Financial data table + download
│   ├── EarningsSummary.tsx         # Earnings analysis display
│   └── LoadingState.tsx            # Animated progress indicator
├── lib/
│   ├── pdf-parser.ts               # PDF/TXT text extraction
│   ├── anthropic-extractor.ts      # LLM prompts and extraction logic
│   ├── excel-generator.ts          # Professional Excel workbook creation
│   └── utils.ts                    # Shared utilities
└── types/
    └── index.ts                    # TypeScript interfaces
```
