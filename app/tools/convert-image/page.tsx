'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import JSZip from 'jszip'

type ImageFormat = 'png' | 'jpeg' | 'webp'

export default function ConvertImagePage() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<{ file: Blob; filename: string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(0.92)

  const convertImage = async (file: File, format: ImageFormat, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')!
        
        // For PNG and WebP with transparency, fill with white background if converting to JPEG
        if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0)

        const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert image'))
            }
          },
          mimeType,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      reader.readAsDataURL(file)
    })
  }

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles)
    setResults([])
  }, [])

  const handleConvert = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    const newResults: typeof results = []

    try {
      for (const file of files) {
        const blob = await convertImage(file, targetFormat, quality)
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat
        const filename = `${baseName}.${extension}`
        newResults.push({ file: blob, filename })
      }
      setResults(newResults)
    } catch (err) {
      console.error('Conversion error:', err)
      alert('Failed to convert images. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadAll = async () => {
    if (results.length === 0) return

    if (results.length === 1) {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(results[0].file)
      link.download = results[0].filename
      link.click()
      URL.revokeObjectURL(link.href)
    } else {
      const zip = new JSZip()
      results.forEach(({ file, filename }) => {
        zip.file(filename, file)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `converted_images_${targetFormat}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResults([])
  }

  return (
    <ToolLayout
      title="Convert Image"
      description="Convert images between PNG, JPG, and WebP formats with quality control."
    >
      <div className="max-w-4xl mx-auto">
        {files.length === 0 ? (
          <FileUpload
            accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
            multiple={true}
            maxFiles={100}
            onFilesSelected={handleFilesSelected}
            className="mb-6"
          />
        ) : results.length === 0 ? (
          <div className="space-y-6">
            {/* Format Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Conversion Settings
              </h3>
              
              <div className="space-y-6">
                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Output Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTargetFormat('png')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        targetFormat === 'png'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">PNG</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Lossless, supports transparency
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setTargetFormat('jpeg')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        targetFormat === 'jpeg'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">JPG</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Smaller size, no transparency
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setTargetFormat('webp')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        targetFormat === 'webp'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">WebP</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Modern format, best compression
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quality Slider (for JPEG and WebP) */}
                {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Lower quality, smaller file</span>
                      <span>Higher quality, larger file</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {files.length} {files.length === 1 ? 'Image' : 'Images'} Selected
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      {file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Format Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>PNG:</strong> Best for graphics, logos, screenshots (lossless)</li>
                    <li><strong>JPG:</strong> Best for photos, removes transparency</li>
                    <li><strong>WebP:</strong> Modern format with excellent compression</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Images Converted Successfully!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {results.length} {results.length === 1 ? 'image' : 'images'} converted to {targetFormat.toUpperCase()}
              </p>
            </div>

            {/* Results List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Converted Images
              </h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {result.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleDownloadAll}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Download {results.length > 1 ? 'All (ZIP)' : 'Image'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Convert More Images
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
