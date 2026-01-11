'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import JSZip from 'jszip'

type PresetSize = {
  name: string
  width: number
  height: number
}

const presetSizes: PresetSize[] = [
  { name: 'Thumbnail', width: 150, height: 150 },
  { name: 'Small (480p)', width: 640, height: 480 },
  { name: 'Medium (720p)', width: 1280, height: 720 },
  { name: 'Large (1080p)', width: 1920, height: 1080 },
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Instagram Portrait', width: 1080, height: 1350 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Twitter Header', width: 1500, height: 500 },
]

export default function ResizeImagePage() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<{ file: Blob; filename: string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<PresetSize | null>(null)
  const [customWidth, setCustomWidth] = useState<number>(800)
  const [customHeight, setCustomHeight] = useState<number>(600)
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [useCustomSize, setUseCustomSize] = useState(false)

  const resizeImage = async (
    file: File,
    targetWidth: number,
    targetHeight: number,
    maintainRatio: boolean
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        let width = targetWidth
        let height = targetHeight

        if (maintainRatio) {
          const ratio = img.width / img.height
          if (targetWidth / targetHeight > ratio) {
            width = targetHeight * ratio
          } else {
            height = targetWidth / ratio
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to resize image'))
            }
          },
          file.type || 'image/png',
          0.92
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

  const handleResize = async () => {
    if (files.length === 0) return

    const width = useCustomSize ? customWidth : (selectedPreset?.width || 800)
    const height = useCustomSize ? customHeight : (selectedPreset?.height || 600)

    setIsProcessing(true)
    const newResults: typeof results = []

    try {
      for (const file of files) {
        const blob = await resizeImage(file, width, height, maintainAspectRatio)
        const ext = file.name.split('.').pop()
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const filename = `${baseName}_${width}x${height}.${ext}`
        newResults.push({ file: blob, filename })
      }
      setResults(newResults)
    } catch (err) {
      console.error('Resize error:', err)
      alert('Failed to resize images. Please try again.')
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
      link.download = 'resized_images.zip'
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
      title="Resize Image"
      description="Resize images with preset dimensions or custom sizes. Supports JPG, PNG, and WebP formats."
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
            {/* Size Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Resize Settings
              </h3>

              {/* Preset vs Custom Toggle */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setUseCustomSize(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    !useCustomSize
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Preset Sizes
                </button>
                <button
                  onClick={() => setUseCustomSize(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    useCustomSize
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Custom Size
                </button>
              </div>

              {/* Preset Sizes */}
              {!useCustomSize && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPreset?.name === preset.name
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                        {preset.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {preset.width} × {preset.height}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Size Inputs */}
              {useCustomSize && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      min={1}
                      max={10000}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      min={1}
                      max={10000}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}

              {/* Maintain Aspect Ratio */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="aspectRatio"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="aspectRatio" className="text-sm text-gray-700 dark:text-gray-300">
                  Maintain aspect ratio
                </label>
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
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleResize}
                disabled={isProcessing || (!useCustomSize && !selectedPreset)}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Resizing...' : 'Resize Images'}
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
                Images Resized Successfully!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {results.length} {results.length === 1 ? 'image' : 'images'} resized
              </p>
            </div>

            {/* Results List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Resized Images
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
                Resize More Images
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
