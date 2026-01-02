'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { deletePDFPages } from '@/lib/pdf-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'
import { PDFDocument } from 'pdf-lib'

export default function DeletePagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([])
  const [pageInput, setPageInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const selectedFile = selectedFiles[0] || null
    setFile(selectedFile)
    setResult(null)
    setError(null)
    setPagesToDelete([])
    setPageInput('')
    
    if (selectedFile) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        setPageCount(pdf.getPageCount())
      } catch (err) {
        setError('Failed to load PDF file')
      }
    }
  }, [])

  const parsePageNumbers = (input: string): number[] => {
    const pages: number[] = []
    const parts = input.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= pageCount && !pages.includes(i - 1)) {
              pages.push(i - 1)
            }
          }
        }
      } else {
        const page = parseInt(part)
        if (!isNaN(page) && page >= 1 && page <= pageCount && !pages.includes(page - 1)) {
          pages.push(page - 1)
        }
      }
    }
    
    return pages.sort((a, b) => a - b)
  }

  const handlePageInputChange = (input: string) => {
    setPageInput(input)
    const parsed = parsePageNumbers(input)
    setPagesToDelete(parsed)
  }

  const handleDelete = async () => {
    if (!file) {
      setError('Please select a PDF file')
      return
    }

    if (pagesToDelete.length === 0) {
      setError('Please specify pages to delete')
      return
    }

    if (pagesToDelete.length >= pageCount) {
      setError('Cannot delete all pages')
      return
    }

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
      setProgress(20)
      const modifiedBytes = await deletePDFPages(file, pagesToDelete)
      
      setProgress(80)
      const blob = new Blob([new Uint8Array(modifiedBytes)], { type: 'application/pdf' })
      
      setProgress(100)
      setResult(blob)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete pages. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
    setPageCount(0)
    setPagesToDelete([])
    setPageInput('')
  }

  return (
    <ToolLayout
      title="Delete Pages"
      description="Remove specific pages from your PDF"
    >
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <>
            <FileUpload
              accept={['application/pdf', '.pdf']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {file && pageCount > 0 && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  Delete Pages
                </h3>

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📄 This PDF has <strong>{pageCount}</strong> page{pageCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pages to Delete (e.g., "1,3,5-7")
                  </label>
                  <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    placeholder="1,3,5-7"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                  {pagesToDelete.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Will delete {pagesToDelete.length} page{pagesToDelete.length !== 1 ? 's' : ''} ({pagesToDelete.map(p => p + 1).join(', ')})
                    </p>
                  )}
                </div>

                <button
                  onClick={handleDelete}
                  disabled={processing || pagesToDelete.length === 0}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Deleting...' : 'Delete Pages'}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Deleting pages..." />
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Pages Deleted Successfully!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {pagesToDelete.length} page{pagesToDelete.length !== 1 ? 's' : ''} removed
            </p>
            
            <div className="mb-6">
              <DownloadButton
                file={result}
                filename={file?.name.replace('.pdf', '_modified.pdf') || 'modified.pdf'}
              />
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Delete More Pages
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
