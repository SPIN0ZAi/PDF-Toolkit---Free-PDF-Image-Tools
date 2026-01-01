'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { compressPDF } from '@/lib/pdf-utils'
import { checkRateLimit, incrementRateLimit, formatFileSize } from '@/lib/utils'

export default function CompressPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; newSize: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFile(selectedFiles[0] || null)
    setResult(null)
    setError(null)
  }, [])

  const handleCompress = async () => {
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
      
      const compressedBytes = await compressPDF(file, quality)
      
      setProgress(80)
      const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' })
      
      setProgress(100)
      setResult({
        blob,
        originalSize: file.size,
        newSize: blob.size
      })
      
      incrementRateLimit()
    } catch (err) {
      console.error('Compression error:', err)
      setError(err instanceof Error ? err.message : 'Failed to compress PDF. Please try again.')
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

  const compressionRatio = result ? 
    ((1 - result.newSize / result.originalSize) * 100).toFixed(1) : '0'

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality"
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
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Compression Quality
                </h3>
                
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Note:</strong> PDF compression results vary based on content. 
                    PDFs with already-compressed images may not reduce much. 
                    For best results, use PDFs with uncompressed images.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <button
                    onClick={() => setQuality('low')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      quality === 'low'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800 mb-1">Maximum</div>
                      <div className="text-xs text-gray-600">Smallest file</div>
                      <div className="text-xs text-gray-500 mt-1">Lower quality</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setQuality('medium')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      quality === 'medium'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800 mb-1">Recommended</div>
                      <div className="text-xs text-gray-600">Balanced</div>
                      <div className="text-xs text-gray-500 mt-1">Good quality</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setQuality('high')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      quality === 'high'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800 mb-1">Minimal</div>
                      <div className="text-xs text-gray-600">Larger file</div>
                      <div className="text-xs text-gray-500 mt-1">Best quality</div>
                    </div>
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Current file:</strong> {file.name} ({formatFileSize(file.size)})
                  </p>
                </div>

                <button
                  onClick={handleCompress}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Compressing...' : 'Compress PDF'}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Compressing your PDF..." />
              </div>
            )}

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
              PDF Compressed Successfully!
            </h3>
            
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Original Size</p>
                  <p className="text-xl font-bold text-gray-800">{formatFileSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Size</p>
                  <p className="text-xl font-bold text-green-600">{formatFileSize(result.newSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reduction</p>
                  <p className="text-xl font-bold text-primary-600">{compressionRatio}%</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                You saved {formatFileSize(result.originalSize - result.newSize)}!
              </p>
            </div>

            <DownloadButton
              file={result.blob}
              filename={file ? file.name.replace('.pdf', '_compressed.pdf') : 'compressed.pdf'}
              className="mb-4"
            />

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Compress Another PDF
            </button>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">About PDF Compression:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Optimizes PDF structure and removes unused objects</li>
            <li>Client-side compression preserves your privacy</li>
            <li>Results vary significantly based on original PDF content</li>
            <li>PDFs with already-compressed images won't reduce much</li>
            <li>Best results with PDFs containing uncompressed images or scans</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> For maximum compression, convert your PDF to images first, 
              then compress the images, then convert back to PDF using our other tools!
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
