'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  toolType: 'financial' | 'earnings'
}

const FINANCIAL_STEPS = [
  'Extracting text from document...',
  'Identifying income statement section...',
  'Extracting revenue line items...',
  'Extracting operating expenses...',
  'Extracting net income and EPS...',
  'Normalizing to standard labels...',
  'Assigning confidence levels...',
  'Preparing results...',
]

const EARNINGS_STEPS = [
  'Extracting text from document...',
  'Identifying company and period...',
  'Analyzing management tone...',
  'Extracting key positives...',
  'Identifying key concerns...',
  'Parsing forward guidance...',
  'Identifying growth initiatives...',
  'Assessing capacity utilization...',
  'Finalizing analysis...',
]

export default function LoadingState({ toolType }: LoadingStateProps) {
  const steps = toolType === 'financial' ? FINANCIAL_STEPS : EARNINGS_STEPS
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepDuration = 3500 / steps.length
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, stepDuration)

    const progressTimer = setInterval(() => {
      setProgress(prev => (prev < 92 ? prev + 1 : prev))
    }, 35)

    return () => {
      clearInterval(timer)
      clearInterval(progressTimer)
    }
  }, [steps.length])

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4 animate-fade-in">
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="font-semibold text-slate-700 text-base">
          {toolType === 'financial' ? 'Extracting Financial Data' : 'Analyzing Earnings Call'}
        </p>
        <p className="text-slate-500 text-sm mt-1">Powered by Llama 3.3 70B via Groq — this may take 10–20 seconds</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Processing</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current step */}
      <div className="w-full max-w-md space-y-1.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
              i < currentStep
                ? 'text-emerald-600'
                : i === currentStep
                ? 'text-indigo-600 font-medium'
                : 'text-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border ${
                i < currentStep
                  ? 'bg-emerald-500 border-emerald-500'
                  : i === currentStep
                  ? 'border-indigo-500 bg-white'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {i < currentStep ? (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i === currentStep ? (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              ) : null}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
