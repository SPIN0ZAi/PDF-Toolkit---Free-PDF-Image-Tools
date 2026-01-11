'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import DownloadButton from '@/components/DownloadButton'
import JSZip from 'jszip'

type CompressionLevel = 'low' | 'medium' | 'high'

export default function CompressImagePage() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<{ file: Blob; filename: string; originalSize: number; compressedSize: number }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium')

  const compressionQuality: Record<CompressionLevel, number> = {
    low: 0.9,      // 90% quality - light compression
    medium: 0.7,   // 70% quality - balanced
    high: 0.5,     // 50% quality - maximum compression
  }

  const compressImage = async (file: File, quality: number): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> => {
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
        ctx.drawImage(img, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                originalSize: file.size,
                compressedSize: blob.size
              })
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
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

  const handleCompress = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    const quality = compressionQuality[compressionLevel]
    const newResults: typeof results = []

    try {
      for (const file of files) {
        const { blob, originalSize, compressedSize } = await compressImage(file, quality)
        const filename = file.name.replace(/\.[^.]+$/, '_compressed.jpg')
        newResults.push({ file: blob, filename, originalSize, compressedSize })
      }
      setResults(newResults)
    } catch (err) {
      console.error('Compression error:', err)
      alert('Failed to compress images. Please try again.')
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
      link.download = 'compressed_images.zip'
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResults([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const calculateReduction = (original: number, compressed: number) => {
    return ((1 - compressed / original) * 100).toFixed(1)
  }

  return (
    <ToolLayout
      title="Compress Image"
      description="Reduce image file sizes while maintaining quality. Supports JPG, PNG, and WebP formats."
    >
      <div className="max-w-4xl mx-auto">
        {files.length === 0 ? (
          <FileUpload
            accept={['image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp']}
            multiple={true}
            maxFiles={50}
            onFilesSelected={handleFilesSelected}
            className="mb-6"
          />
        ) : results.length === 0 ? (
          <div className="space-y-6">
            {/* Compression Level Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Compression Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compression Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setCompressionLevel('low')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        compressionLevel === 'low'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">Low</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">90% quality</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">~10-20% smaller</div>
                    </button>
                    
                    <button
                      onClick={() => setCompressionLevel('medium')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        compressionLevel === 'medium'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">Medium</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">70% quality</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">~40-60% smaller</div>
                    </button>
                    
                    <button
                      onClick={() => setCompressionLevel('high')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        compressionLevel === 'high'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">High</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">50% quality</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">~60-80% smaller</div>
                    </button>
                  </div>
                </div>
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
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Compressing...' : 'Compress Images'}
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
            {/* Success Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Images Compressed Successfully!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {results.length} {results.length === 1 ? 'image' : 'images'} compressed
              </p>
            </div>

            {/* Results List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Compression Results
              </h3>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                        {result.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)}</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {calculateReduction(result.originalSize, result.compressedSize)}% smaller
                      </span>
                    </div>
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
                Compress More Images
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
