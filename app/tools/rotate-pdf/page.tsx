'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { rotatePDF } from '@/lib/pdf-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'
import { PDFDocument } from 'pdf-lib'

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [rotation, setRotation] = useState<90 | 180 | 270>(90)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFile(selectedFiles[0] || null)
    setResult(null)
    setError(null)
  }, [])

  const handleRotate = async () => {
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
      const rotatedBytes = await rotatePDF(file, rotation)
      
      setProgress(80)
      const blob = new Blob([new Uint8Array(rotatedBytes)], { type: 'application/pdf' })
      
      setProgress(100)
      setResult(blob)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Rotation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to rotate PDF. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate all pages in your PDF document"
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

            {file && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  Rotation Angle
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[90, 180, 270].map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setRotation(angle as 90 | 180 | 270)}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        rotation === angle
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{angle}°</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {angle === 90 ? 'Clockwise' : angle === 180 ? 'Upside Down' : 'Counter-clockwise'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRotate}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Rotating...' : 'Rotate PDF'}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Rotating your PDF..." />
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
              PDF Rotated Successfully!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All pages rotated {rotation}° {rotation === 90 ? 'clockwise' : rotation === 180 ? '' : 'counter-clockwise'}
            </p>
            
            <div className="mb-6">
              <DownloadButton
                file={result}
                filename={file?.name.replace('.pdf', `_rotated_${rotation}.pdf`) || 'rotated.pdf'}
              />
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Rotate Another PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
