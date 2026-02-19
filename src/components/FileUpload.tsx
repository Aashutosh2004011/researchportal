'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  disabled?: boolean
  hint?: string
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['.pdf', '.txt'],
  maxSizeMB = 10,
  disabled = false,
  hint,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null)

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0]?.message || 'File rejected'
        setError(err)
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      if (file.size > maxSizeBytes) {
        setError(`File too large. Max size is ${maxSizeMB} MB. Your file: ${(file.size / (1024 * 1024)).toFixed(1)} MB`)
        return
      }

      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect, maxSizeBytes, maxSizeMB]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setError(null)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center gap-3 min-h-[200px]',
          isDragActive && !isDragReject && 'border-indigo-400 bg-indigo-50',
          isDragReject && 'border-red-400 bg-red-50',
          !isDragActive && !selectedFile && 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50',
          selectedFile && 'border-emerald-400 bg-emerald-50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50'
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 text-sm truncate max-w-[280px]">{selectedFile.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{formatSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={clearFile}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
              title="Remove file"
            >
              <X size={14} className="text-slate-500" />
            </button>
            <p className="text-xs text-emerald-600 font-medium">File ready — click Analyze to proceed</p>
          </>
        ) : (
          <>
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                isDragReject ? 'bg-red-100' : 'bg-indigo-100'
              )}
            >
              <Upload
                className={cn('w-7 h-7', isDragReject ? 'text-red-500' : 'text-indigo-500')}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 text-sm">
                {isDragActive
                  ? isDragReject
                    ? 'File type not supported'
                    : 'Drop your file here'
                  : 'Drag & drop or click to upload'}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {acceptedTypes.join(', ')} • Max {maxSizeMB} MB
              </p>
              {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-3 border border-red-200">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
