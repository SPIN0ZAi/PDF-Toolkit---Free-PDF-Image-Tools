'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { imageToICO, COMMON_ICO_SIZES, IcoSize } from '@/lib/image-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/utils'
import { Check } from 'lucide-react'

export default function ImageToICOPage() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<IcoSize[]>([
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
  ])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFile(selectedFiles[0] || null)
    setResult(null)
    setError(null)
  }, [])

  const toggleSize = useCallback((size: IcoSize) => {
    setSelectedSizes(prev => {
      const exists = prev.some(s => s.width === size.width && s.height === size.height)
      if (exists) {
        // Keep at least one size selected
        if (prev.length === 1) return prev
        return prev.filter(s => !(s.width === size.width && s.height === size.height))
      } else {
        return [...prev, size].sort((a, b) => a.width - b.width)
      }
    })
  }, [])

  const handleConvert = async () => {
    if (!file) {
      setError('Please select an image file')
      return
    }

    if (selectedSizes.length === 0) {
      setError('Please select at least one icon size')
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
      
      const icoBlob = await imageToICO(file, selectedSizes)
      
      setProgress(100)
      setResult(icoBlob)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert image to ICO. Please try again.')
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

  const isSizeSelected = (size: IcoSize) => {
    return selectedSizes.some(s => s.width === size.width && s.height === size.height)
  }

  return (
    <ToolLayout
      title="Image to ICO"
      description="Convert images to Windows icon format with multiple resolutions"
    >
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <>
            <FileUpload
              accept={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {/* Size Selection */}
            {file && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Select Icon Sizes
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Choose one or more sizes for your ICO file. Multiple sizes allow the icon 
                  to display properly at different resolutions.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {COMMON_ICO_SIZES.map((size) => (
                    <button
                      key={`${size.width}x${size.height}`}
                      onClick={() => toggleSize(size)}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSizeSelected(size)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {isSizeSelected(size) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {size.width}×{size.height}
                        </div>
                        <div className="text-xs text-gray-500">
                          {size.width <= 32 ? 'Small' : size.width <= 64 ? 'Medium' : 'Large'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Recommended:</strong> Select 16×16, 32×32, and 48×48 for standard Windows icons.
                    Add larger sizes (256×256) for high-DPI displays.
                  </p>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={processing || selectedSizes.length === 0}
                  className="w-full mt-6 px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Converting...' : `Convert to ICO (${selectedSizes.length} size${selectedSizes.length !== 1 ? 's' : ''})`}
                </button>
              </div>
            )}

            {/* Progress */}
            {processing && (
              <div className="mb-6">
                <ProgressBar
                  progress={progress}
                  status="Converting image to ICO format..."
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
              ICO Created Successfully!
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your image has been converted to ICO format with {selectedSizes.length} size{selectedSizes.length !== 1 ? 's' : ''}.
            </p>

            <div className="mb-6">
              <div className="inline-block p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-2">Included sizes:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedSizes.map((size, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm">
                      {size.width}×{size.height}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <DownloadButton
              file={result}
              filename={file ? file.name.replace(/\.[^/.]+$/, '.ico') : 'icon.ico'}
              className="mb-4"
            />

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Convert Another Image
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">About ICO Files:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>ICO files can contain multiple image sizes in one file</li>
            <li>Windows uses different sizes for different contexts (taskbar, desktop, file explorer)</li>
            <li>Common sizes: 16×16, 32×32, 48×48, 256×256</li>
            <li>Transparency is preserved for PNG source images</li>
            <li>Best used for website favicons and Windows application icons</li>
          </ul>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> For best quality, use PNG images with transparency. 
              Square images work best for icons.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
