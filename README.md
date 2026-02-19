# AI Research Portal

An internal research portal built with **Next.js 15** + **Llama 3.3 70B (Groq)** that uses AI as specific, structured research tools — not an open-ended chatbot. Upload a document and get analyst-ready outputs in seconds.

Live demo: _deploy to Vercel and add the URL here_

---

## Tools

### Option A — Financial Statement Extraction
Upload an annual report, 10-K, 10-Q, or earnings release and extract income statement line items into a professionally formatted, multi-sheet Excel file.

**What gets extracted:**
- Revenue, COGS, Gross Profit
- Operating Expenses: R&D, Sales & Marketing, G&A, Depreciation & Amortization
- Operating Income / EBIT, Interest Expense/Income
- Pre-tax Income, Income Tax, Net Income
- EPS (Basic & Diluted), Shares Outstanding
- EBITDA / Adjusted EBITDA (if present)
- All fiscal years / quarters found in the document

**Output — 3-sheet Excel workbook:**
| Sheet | Contents |
|-------|----------|
| Income Statement | Formatted table, color-coded by confidence, YoY growth columns, margins |
| Raw Data | Original labels from document vs. standardized labels, all values |
| Extraction Report | Quality summary, confidence counts, extraction notes |

**Key design decisions:**
- Confidence score per line item (High / Medium / Low / Missing) — analyst sees data quality at a glance
- Original document label preserved alongside standardized label (e.g. `"Operating costs"` → `Operating Expenses`)
- Parenthetical negatives `(1,234)` correctly stored as negative numbers
- Multiple years extracted simultaneously; YoY % auto-calculated in Excel
- Missing data shown as `—` / `N/A`, never fabricated

---

### Option B — Earnings Call Analysis
Upload an earnings call transcript or MD&A section and get a structured, quote-backed analysis.

**Output:**

| Section | Detail |
|---------|--------|
| Management Tone | Optimistic / Cautious / Neutral / Pessimistic + confidence + rationale |
| Key Positives | 3–5 points, each with a direct supporting quote and category tag |
| Key Concerns | 3–5 points, each with a direct supporting quote and category tag |
| Forward Guidance | Revenue, Margin, CapEx — with specificity indicator (Specific / Qualitative / Not Provided) |
| Capacity Utilization | Current level, trend (improving / declining / stable), supporting detail |
| Growth Initiatives | 2–3 named initiatives with description, timeline, and investment amount |

**Key design decisions:**
- Every point is anchored to a direct quote — zero hallucination by design
- Tone assessed from linguistic cues (hedging language, confidence expressions, framing) — not keyword counting
- Guidance specificity indicator tells analysts whether management gave real numbers or was vague
- If a section is absent from the document, the output explicitly states `"Not mentioned in document"`
- Exportable as a plain-text summary file

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| LLM | Llama 3.3 70B via Groq API (free tier) |
| PDF Parsing | pdf-parse (Node.js server-side) |
| Excel Generation | ExcelJS (3-sheet professional workbook) |
| File Upload UI | react-dropzone |
| Deployment | Vercel |

---

## Local Setup

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone the repo
git clone https://github.com/Aashutosh2004011/researchportal.git
cd researchportal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Open .env.local and add your Groq API key
```

**Get a free Groq API key (30 seconds, no credit card):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google or GitHub
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`) and paste it in `.env.local`

```bash
# 4. Start the development server
npm run dev

# Open http://localhost:3000
```

---

## Deploy to Vercel

### Option 1 — Vercel Dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import `researchportal` from GitHub
2. Under **Environment Variables**, add:
   ```
   GROQ_API_KEY = gsk_your_key_here
   ```
3. Click **Deploy**

### Option 2 — Vercel CLI

```bash
npm install -g vercel
vercel --prod
# When prompted for environment variables, add GROQ_API_KEY
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | Free Groq key from [console.groq.com](https://console.groq.com) — no credit card |
| `GROQ_MODEL` | No | Override model (default: `llama-3.3-70b-versatile`). Alternatives: `llama-3.1-8b-instant` (faster) |

---

## Limitations

| Limitation | Detail |
|------------|--------|
| File formats | PDF (text-based) and `.txt` only. Scanned / image-based PDFs are not supported (no OCR). |
| File size | 10 MB max per upload |
| Processing time | 10–20 seconds per document (Groq is very fast) |
| Large documents | Documents over ~100K characters are truncated; extraction notes will indicate this |
| Vercel free tier | Serverless functions have a 60-second timeout; very large PDFs may occasionally time out |
| Data accuracy | All outputs are grounded in the uploaded document. Missing data is flagged, never fabricated. |

---

## Project Structure

```
research-portal/
├── .env.local.example          ← Copy to .env.local and add your key
├── vercel.json                 ← Sets 60s timeout for API routes
├── src/
│   ├── app/
│   │   ├── page.tsx            ← Home page (tool selection cards)
│   │   ├── financial/
│   │   │   └── page.tsx        ← Financial extraction tool UI
│   │   ├── earnings/
│   │   │   └── page.tsx        ← Earnings analysis tool UI
│   │   └── api/
│   │       ├── extract-financial/route.ts   ← PDF → income statement JSON
│   │       ├── analyze-earnings/route.ts    ← PDF → earnings analysis JSON
│   │       └── download-excel/route.ts      ← JSON → .xlsx binary response
│   ├── components/
│   │   ├── Header.tsx              ← Sticky navigation bar
│   │   ├── FileUpload.tsx          ← Drag-and-drop with validation
│   │   ├── FinancialResults.tsx    ← Data table, confidence badges, Excel download
│   │   ├── EarningsSummary.tsx     ← Tone banner, quote cards, guidance sections
│   │   └── LoadingState.tsx        ← Animated step-by-step progress indicator
│   ├── lib/
│   │   ├── anthropic-extractor.ts  ← Groq/Llama prompts and extraction logic
│   │   ├── excel-generator.ts      ← 3-sheet ExcelJS workbook builder
│   │   ├── pdf-parser.ts           ← PDF/TXT text extraction (Node.js only)
│   │   └── utils.ts                ← Shared helpers (formatting, parsing)
│   └── types/
│       └── index.ts                ← TypeScript interfaces for all data shapes
└── testing/
    ├── sample-financial-statement.txt   ← Test file for Option A
    └── sample-earnings-call.txt         ← Test file for Option B
```

---

## Testing the Tools

Two sample files are included in the `/testing` folder:

**`sample-financial-statement.txt`** → use with Financial Statement Extraction
- Acme Corporation FY2021–FY2023 income statement
- Tests multi-year extraction, EPS, margins, restructuring charges

**`sample-earnings-call.txt`** → use with Earnings Call Analysis
- Full Q4 FY2023 earnings call with CEO + CFO remarks and Q&A
- Tests tone detection, quantitative guidance ($14.0–14.4B revenue), 3 growth initiatives, capacity utilization (72%)
