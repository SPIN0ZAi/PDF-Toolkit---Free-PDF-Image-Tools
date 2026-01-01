'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { icoToImages } from '@/lib/image-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'

export default function ICOToImagePage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ blob: Blob; width: number; height: number }[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFile(selectedFiles[0] || null)
    setResults(null)
    setError(null)
  }, [])

  const handleConvert = async () => {
    if (!file) {
      setError('Please select an ICO file')
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
      setProgress(20)
      
      const images = await icoToImages(file)
      
      if (images.length === 0) {
        throw new Error('No images found in ICO file')
      }
      
      setProgress(100)
      setResults(images)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract images from ICO. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResults(null)
    setError(null)
    setProgress(0)
  }

  return (
    <ToolLayout
      title="ICO to Image"
      description="Extract images from Windows icon files and convert to PNG"
    >
      <div className="max-w-4xl mx-auto">
        {!results ? (
          <>
            <FileUpload
              accept={['image/x-icon', '.ico']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {file && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6 text-center">
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Extracting Images...' : 'Convert to PNG'}
                </button>
              </div>
            )}

            {/* Progress */}
            {processing && (
              <div className="mb-6">
                <ProgressBar
                  progress={progress}
                  status="Extracting images from ICO file..."
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
          <div className="bg-white rounded-lg shadow-md p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Images Extracted Successfully!
              </h3>
              
              <p className="text-gray-600 mb-4">
                Found {results.length} image{results.length !== 1 ? 's' : ''} in the ICO file.
              </p>
            </div>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {results.map((image, index) => {
                const url = URL.createObjectURL(image.blob)
                return (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="aspect-square bg-white rounded flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={url} 
                        alt={`${image.width}x${image.height}`}
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-700">
                      {image.width}×{image.height}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Download Buttons */}
            <DownloadButton
              files={results.map((img, i) => ({
                blob: img.blob,
                filename: file ? 
                  `${file.name.replace(/\.ico$/i, '')}_${img.width}x${img.height}.png` : 
                  `icon_${img.width}x${img.height}.png`
              }))}
              zipFilename={file ? file.name.replace(/\.ico$/i, '_images.zip') : 'icon_images.zip'}
              className="mb-4"
            />

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Convert Another ICO
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">How to Extract ICO Images:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Upload a .ico file</li>
            <li>Click "Convert to PNG" to extract all sizes</li>
            <li>Download individual sizes or all as a ZIP file</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> ICO files often contain multiple image sizes (16×16, 32×32, 48×48, etc.). 
              This tool extracts all sizes and converts them to PNG format with transparency preserved.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
