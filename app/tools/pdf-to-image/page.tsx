'use client'

import { useState, useCallback, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { pdfToImages, getPDFPageCount } from '@/lib/pdf-to-image'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'

export default function PDFToImagePage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Array<{ blob: Blob; pageNumber: number }> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const selectedFile = selectedFiles[0] || null
    setFile(selectedFile)
    setResults(null)
    setError(null)
    
    if (selectedFile) {
      try {
        const count = await getPDFPageCount(selectedFile)
        setPageCount(count)
      } catch (err) {
        console.error('Error getting page count:', err)
        setPageCount(0)
      }
    } else {
      setPageCount(0)
    }
  }, [])

  const handleConvert = async () => {
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
      setProgress(10)
      
      const images = await pdfToImages(file, format)
      
      setProgress(90)
      setResults(images)
      setProgress(100)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert PDF to images. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResults(null)
    setError(null)
    setProgress(0)
    setPageCount(0)
  }

  return (
    <ToolLayout
      title="PDF to Image"
      description="Convert PDF pages to JPG or PNG images"
    >
      <div className="max-w-4xl mx-auto">
        {!results ? (
          <>
            <FileUpload
              accept={['application/pdf', '.pdf']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {file && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Conversion Settings
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>PDF:</strong> {file.name} ({pageCount} page{pageCount !== 1 ? 's' : ''})
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormat('png')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        format === 'png'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">PNG</div>
                        <div className="text-xs text-gray-600">Lossless, transparency</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setFormat('jpeg')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        format === 'jpeg'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">JPEG</div>
                        <div className="text-xs text-gray-600">Smaller file size</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Each page will be converted to a separate image. 
                    High-quality images are generated (2x scale).
                  </p>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Converting...' : `Convert to ${format.toUpperCase()}`}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Converting PDF pages to images..." />
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
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Conversion Complete!
              </h3>
              
              <p className="text-gray-600 mb-4">
                Successfully converted {results.length} page{results.length !== 1 ? 's' : ''} to {format.toUpperCase()}.
              </p>
            </div>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto">
              {results.map((result) => {
                const url = URL.createObjectURL(result.blob)
                return (
                  <div key={result.pageNumber} className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                    <div className="aspect-[3/4] bg-white rounded flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Page ${result.pageNumber}`}
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                    </div>
                    <p className="text-center text-xs font-medium text-gray-700">
                      Page {result.pageNumber}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Download Buttons */}
            <DownloadButton
              files={results.map((result) => ({
                blob: result.blob,
                filename: file ? 
                  `${file.name.replace(/\.pdf$/i, '')}_page_${result.pageNumber}.${format}` : 
                  `page_${result.pageNumber}.${format}`
              }))}
              zipFilename={file ? file.name.replace(/\.pdf$/i, `_images.zip`) : 'pdf_images.zip'}
              className="mb-4"
            />

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Convert Another PDF
            </button>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">About PDF to Image:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Each page is converted to a separate high-quality image</li>
            <li>PNG format preserves transparency and quality (recommended)</li>
            <li>JPEG format creates smaller files but no transparency</li>
            <li>Images are rendered at 2x scale for sharp results</li>
            <li>Download individual pages or all as a ZIP file</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
