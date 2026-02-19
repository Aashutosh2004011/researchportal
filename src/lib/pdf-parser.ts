/**
 * Server-side PDF text extraction utility.
 * Uses pdf-parse which is Node.js only — must run in Node runtime (not edge).
 */

export interface ParsedDocument {
  text: string
  pageCount: number
  info: Record<string, string>
  truncated: boolean
  originalLength: number
}

const MAX_CHARS = 100_000 // ~25,000 tokens — well within Claude's 200K context

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  // Dynamic import to avoid issues with Next.js module bundling
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')

  const data = await pdfParse(buffer, {
    // Limit page rendering to improve speed on very large PDFs
    max: 100,
  })

  const fullText: string = data.text || ''
  const originalLength = fullText.length
  const truncated = fullText.length > MAX_CHARS

  // If truncated, try to cut at a natural boundary
  let text = fullText
  if (truncated) {
    const slice = fullText.slice(0, MAX_CHARS)
    const lastDoubleNewline = slice.lastIndexOf('\n\n')
    text = lastDoubleNewline > MAX_CHARS * 0.8
      ? slice.slice(0, lastDoubleNewline)
      : slice
  }

  return {
    text: cleanText(text),
    pageCount: data.numpages || 0,
    info: data.info || {},
    truncated,
    originalLength,
  }
}

/**
 * Parse plain text files (.txt)
 */
export async function parseTextFile(buffer: Buffer): Promise<ParsedDocument> {
  const fullText = buffer.toString('utf-8')
  const originalLength = fullText.length
  const truncated = fullText.length > MAX_CHARS
  const text = truncated ? fullText.slice(0, MAX_CHARS) : fullText

  return {
    text: cleanText(text),
    pageCount: 1,
    info: {},
    truncated,
    originalLength,
  }
}

/**
 * Clean extracted text — normalize whitespace, remove page artifacts
 */
function cleanText(text: string): string {
  return text
    // Normalize various newline styles
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines (keep max 2 consecutive)
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove null bytes and other control characters (except tab and newline)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ')
    // Normalize spaces
    .replace(/ {3,}/g, '  ')
    .trim()
}
