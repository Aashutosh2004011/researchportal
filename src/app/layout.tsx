import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'AI Research Portal',
  description: 'Professional AI-powered document analysis: financial statement extraction and earnings call analysis.',
  keywords: ['financial analysis', 'earnings call', 'AI', 'research', 'document analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Header />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-400">
              AI Research Portal — Built with Llama 3.3 70B (Groq) + Next.js 15
            </p>
            <p className="text-xs text-slate-400">
              For research use only. Always verify AI-extracted data against source documents.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
