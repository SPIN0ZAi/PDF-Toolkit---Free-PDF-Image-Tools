'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { mergePDFs } from '@/lib/pdf-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'
import { GripVertical, X } from 'lucide-react'

interface UploadedFile {
  file: File
  id: string
}

export default function MergePDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
    }))
    setFiles(uploadedFiles)
    setResult(null)
    setError(null)
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const moveFile = useCallback((fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const [removed] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, removed)
      return newFiles
    })
  }, [])

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge')
      return
    }

    // Check rate limit
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetIn / 60000)
      setError(`Rate limit exceeded. Please try again in ${minutes} minutes.`)
      return
    }

    setProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate progress
      setProgress(10)

      const pdfFiles = files.map(f => f.file)
      
      setProgress(30)
      const mergedPdfBytes = await mergePDFs(pdfFiles)
      
      setProgress(80)
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      
      setProgress(100)
      setResult(blob)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Merge error:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResult(null)
    setError(null)
    setProgress(0)
  }

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document"
    >
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <>
            <FileUpload
              accept={['application/pdf', '.pdf']}
              multiple={true}
              maxFiles={50}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {/* Reorderable file list */}
            {files.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  PDF Order (drag to reorder)
                </h3>
                
                <div className="space-y-2">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', index.toString())
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                        if (fromIndex !== index) {
                          moveFile(fromIndex, index)
                        }
                      }}
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {index + 1}. {item.file.name}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFile(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMerge}
                  disabled={processing || files.length < 2}
                  className="w-full mt-6 px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Merging PDFs...' : `Merge ${files.length} PDFs`}
                </button>
              </div>
            )}

            {/* Progress */}
            {processing && (
              <div className="mb-6">
                <ProgressBar
                  progress={progress}
                  status="Merging your PDFs..."
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              PDF Merged Successfully!
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your {files.length} PDF files have been combined into one document.
            </p>

            <DownloadButton
              file={result}
              filename="merged.pdf"
              className="mb-4"
            />

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Merge More PDFs
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">How to Merge PDFs:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Upload 2 or more PDF files (up to 50 files)</li>
            <li>Drag and drop to reorder the PDFs</li>
            <li>Click "Merge PDFs" to combine them</li>
            <li>Download your merged PDF file</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> The files will be merged in the order shown. 
              Use the grip handle to drag files up or down to change the order.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
