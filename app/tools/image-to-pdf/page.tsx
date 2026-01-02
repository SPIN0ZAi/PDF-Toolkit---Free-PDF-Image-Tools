'use client'

import { useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import ProgressBar from '@/components/ProgressBar'
import DownloadButton from '@/components/DownloadButton'
import { PDFDocument } from 'pdf-lib'
import { checkRateLimit, incrementRateLimit, formatFileSize } from '@/lib/utils'

export default function ImageToPDFPage() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles)
    setResult(null)
    setError(null)
  }, [])

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please select at least one image')
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
      
      // Create new PDF
      const pdfDoc = await PDFDocument.create()
      
      // Process each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const arrayBuffer = await file.arrayBuffer()
        
        // Embed image based on type
        let image
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer)
        } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer)
        } else {
          // Convert other formats to PNG via canvas
          const img = await createImageBitmap(file)
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          
          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png')
          })
          const pngArrayBuffer = await pngBlob.arrayBuffer()
          image = await pdfDoc.embedPng(pngArrayBuffer)
        }
        
        // Add page with image dimensions
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height
        })
        
        setProgress(10 + (80 * (i + 1) / files.length))
      }
      
      setProgress(90)
      
      // Save PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      
      setProgress(100)
      setResult(blob)
      
      incrementRateLimit()
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert images to PDF. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResult(null)
    setError(null)
    setProgress(0)
  }

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert images (JPG, PNG, etc.) into a PDF document"
    >
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <>
            <FileUpload
              accept={['image/*', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']}
              multiple={true}
              maxFiles={50}
              onFilesSelected={handleFilesSelected}
              className="mb-6"
            />

            {files.length > 0 && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📄 <strong>{files.length}</strong> image{files.length !== 1 ? 's' : ''} will be converted to PDF
                    <br />
                    Images will appear in the order they were selected
                  </p>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Converting...' : 'Convert to PDF'}
                </button>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} status="Converting images to PDF..." />
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
              PDF Created Successfully!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {files.length} image{files.length !== 1 ? 's' : ''} converted • {formatFileSize(result.size)}
            </p>
            
            <div className="mb-6">
              <DownloadButton
                file={result}
                filename="images_to_pdf.pdf"
              />
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Convert More Images
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
