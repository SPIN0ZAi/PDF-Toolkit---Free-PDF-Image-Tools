'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { splitPDF } from '@/lib/pdf-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [splitMode, setSplitMode] = useState<'all' | 'range'>('all')
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Blob[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const selectedFile = selectedFiles[0] || null
    setFile(selectedFile)
    setResults([])
    setError(null)
    
    if (selectedFile) {
      try {
        // Load PDF to get page count
        const arrayBuffer = await selectedFile.arrayBuffer()
        const { PDFDocument } = await import('pdf-lib')
        const pdf = await PDFDocument.load(arrayBuffer)
        const count = pdf.getPageCount()
        setPageCount(count)
        setEndPage(count)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('Failed to load PDF file')
      }
    }
  }, [])

  const handleSplit = async () => {
    if (!file) {
      setError('Please select a PDF file')
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
      
      let splitPages: Uint8Array[]
      
      if (splitMode === 'all') {
        // Split into individual pages - create a range for each page
        const ranges = Array.from(
          { length: pageCount },
          (_, i) => ({ start: i + 1, end: i + 1 })
        )
        splitPages = await splitPDF(file, ranges)
      } else {
        // Split specific range - each page as separate PDF
        const ranges = Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => ({ start: startPage + i, end: startPage + i })
        )
        splitPages = await splitPDF(file, ranges)
      }
      
      setProgress(80)
      
      // Convert to blobs
      const blobs = splitPages.map(bytes => 
        new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
      )
      
      setProgress(100)
      setResults(blobs)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Split error:', err)
      setError(err instanceof Error ? err.message : 'Failed to split PDF. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResults([])
    setError(null)
    setProgress(0)
    setPageCount(0)
  }

  return (
    <ToolLayout
      title="Split PDF"
      description="Split PDF into individual pages or extract specific page ranges"
    >
      <div className="max-w-4xl mx-auto">
        {results.length === 0 ? (
          <>
            <FileUpload
              accept={['application/pdf', '.pdf']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {file && pageCount > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Split Options
                </h3>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📄 This PDF has <strong>{pageCount}</strong> page{pageCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center mb-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === 'all'}
                      onChange={() => setSplitMode('all')}
                      className="mr-3 w-4 h-4 text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Split into individual pages</div>
                      <div className="text-sm text-gray-600">
                        Creates {pageCount} separate PDF files (one per page)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === 'range'}
                      onChange={() => setSplitMode('range')}
                      className="mr-3 w-4 h-4 text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Extract page range</div>
                      <div className="text-sm text-gray-600">
                        Extract specific pages as individual PDF files
                      </div>
                    </div>
                  </label>
                </div>

                {splitMode === 'range' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Range
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">From</label>
                        <input
                          type="number"
                          min={1}
                          max={pageCount}
                          value={startPage}
                          onChange={(e) => setStartPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="pt-6 text-gray-500">to</div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">To</label>
                        <input
                          type="number"
                          min={1}
                          max={pageCount}
                          value={endPage}
                          onChange={(e) => setEndPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Will extract {Math.max(0, endPage - startPage + 1)} page{endPage - startPage !== 0 ? 's' : ''} as separate PDF files
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSplit}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Splitting...' : 'Split PDF'}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Splitting your PDF..." />
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 animate-slide-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              PDF Split Successfully!
            </h3>
            
            <p className="text-gray-600 mb-6 text-center">
              Created {results.length} PDF file{results.length !== 1 ? 's' : ''}
            </p>
            
            <div className="mb-6">
              <DownloadButton
                files={results.map((blob, index) => ({
                  blob,
                  filename: `${file?.name.replace('.pdf', '')}_page_${index + 1}.pdf`
                }))}
                zipFilename={`${file?.name.replace('.pdf', '')}_split.zip`}
              />
            </div>

            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Split Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
