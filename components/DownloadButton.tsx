'use client'

import { Download, FileArchive } from 'lucide-react'
import { downloadFile, formatFileSize } from '@/lib/utils'
import JSZip from 'jszip'

interface DownloadButtonProps {
  file?: Blob
  filename?: string
  files?: { blob: Blob; filename: string }[]
  zipFilename?: string
  disabled?: boolean
  className?: string
}

export default function DownloadButton({
  file,
  filename,
  files,
  zipFilename = 'files.zip',
  disabled = false,
  className = '',
}: DownloadButtonProps) {
  const handleSingleDownload = () => {
    if (file && filename) {
      downloadFile(file, filename)
    }
  }

  const handleZipDownload = async () => {
    if (!files || files.length === 0) return

    try {
      const zip = new JSZip()
      
      files.forEach(({ blob, filename }) => {
        zip.file(filename, blob)
      })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      downloadFile(zipBlob, zipFilename)
    } catch (error) {
      console.error('Error creating ZIP:', error)
      alert('Failed to create ZIP file. Please try downloading files individually.')
    }
  }

  // Single file download
  if (file && filename) {
    return (
      <button
        onClick={handleSingleDownload}
        disabled={disabled}
        className={`flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <Download className="w-5 h-5" />
        <span>Download {filename}</span>
      </button>
    )
  }

  // Multiple files download
  if (files && files.length > 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Individual downloads */}
        {files.length <= 5 && (
          <div className="space-y-2">
            {files.map(({ blob, filename: fname }, index) => (
              <button
                key={index}
                onClick={() => downloadFile(blob, fname)}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-primary-500 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="truncate">{fname}</span>
                </div>
                <span className="text-xs text-gray-500">{formatFileSize(blob.size)}</span>
              </button>
            ))}
          </div>
        )}

        {/* ZIP download button */}
        {files.length > 1 && (
          <button
            onClick={handleZipDownload}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileArchive className="w-5 h-5" />
            <span>Download All as ZIP ({files.length} files)</span>
          </button>
        )}
      </div>
    )
  }

  return null
}
