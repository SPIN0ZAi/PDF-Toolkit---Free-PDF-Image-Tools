'use client'

import { useCallback, useState } from 'react'
import { Upload, X, FileIcon } from 'lucide-react'
import { validateFileSize, validateFileType, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  accept: string[]
  multiple?: boolean
  maxFiles?: number
  onFilesSelected: (files: File[]) => void
  className?: string
}

export default function FileUpload({
  accept,
  multiple = false,
  maxFiles = 10,
  onFilesSelected,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const validateFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const newErrors: string[] = []

    for (const file of fileArray) {
      // Check file size
      const sizeCheck = validateFileSize(file)
      if (!sizeCheck.valid) {
        newErrors.push(`${file.name}: ${sizeCheck.error}`)
        continue
      }

      // Check file type
      const typeCheck = validateFileType(file, accept)
      if (!typeCheck.valid) {
        newErrors.push(`${file.name}: ${typeCheck.error}`)
        continue
      }

      validFiles.push(file)
    }

    // Check max files limit
    if (validFiles.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`)
      return { validFiles: validFiles.slice(0, maxFiles), errors: newErrors }
    }

    return { validFiles, errors: newErrors }
  }, [accept, maxFiles])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const { validFiles, errors: validationErrors } = validateFiles(files)
    
    setErrors(validationErrors)
    
    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles
      setSelectedFiles(newFiles)
      onFilesSelected(newFiles)
    }
  }, [validateFiles, multiple, selectedFiles, onFilesSelected])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }, [selectedFiles, onFilesSelected])

  const clearAll = useCallback(() => {
    setSelectedFiles([])
    setErrors([])
    onFilesSelected([])
  }, [onFilesSelected])

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 bg-white'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="sr-only"
          accept={accept.join(',')}
          multiple={multiple}
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center">
          <Upload className={`w-16 h-16 mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          
          <h3 className="text-xl font-semibold mb-2 text-gray-700">
            {isDragging ? 'Drop files here' : 'Choose files or drag & drop'}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: {accept.map(a => a.split('/')[1] || a).join(', ').toUpperCase()}
          </p>
          
          <button
            type="button"
            onClick={() => document.getElementById('file-upload')?.click()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            Select Files
          </button>
          
          {multiple && (
            <p className="text-xs text-gray-400 mt-2">
              You can select up to {maxFiles} files
            </p>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-800">
              Selected Files ({selectedFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors animate-slide-up"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
