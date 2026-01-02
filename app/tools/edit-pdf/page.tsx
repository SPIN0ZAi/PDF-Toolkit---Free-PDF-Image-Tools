'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'
import DownloadButton from '@/components/DownloadButton'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { Type, Pen, Eraser, Download, ZoomIn, ZoomOut } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

type Tool = 'text' | 'draw' | 'eraser'

interface Annotation {
  type: 'text' | 'drawing'
  pageNumber: number
  content?: string
  x?: number
  y?: number
  fontSize?: number
  paths?: { x: number; y: number }[][]
}

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedTool, setSelectedTool] = useState<Tool>('text')
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(14)
  const [isDrawing, setIsDrawing] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [zoom, setZoom] = useState(1)
  const [result, setResult] = useState<Blob | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const selectedFile = selectedFiles[0] || null
    setFile(selectedFile)
    setResult(null)
    setAnnotations([])
    
    if (selectedFile) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        console.error('Error loading PDF:', err)
      }
    }
  }, [])

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, zoom])

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return
    
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: zoom * 1.5 })
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // Setup drawing canvas
    if (drawingCanvasRef.current) {
      const drawCanvas = drawingCanvasRef.current
      drawCanvas.width = viewport.width
      drawCanvas.height = viewport.height
      redrawAnnotations()
    }
  }

  const redrawAnnotations = () => {
    if (!drawingCanvasRef.current) return
    const ctx = drawingCanvasRef.current.getContext('2d')!
    ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height)
    
    annotations
      .filter(ann => ann.pageNumber === currentPage)
      .forEach(ann => {
        if (ann.type === 'text' && ann.x && ann.y && ann.content) {
          ctx.font = `${ann.fontSize}px Arial`
          ctx.fillStyle = '#000'
          ctx.fillText(ann.content, ann.x, ann.y)
        } else if (ann.type === 'drawing' && ann.paths) {
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ann.paths.forEach(path => {
            if (path.length < 2) return
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            path.slice(1).forEach(point => ctx.lineTo(point.x, point.y))
            ctx.stroke()
          })
        }
      })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text' && textInput) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newAnnotation: Annotation = {
        type: 'text',
        pageNumber: currentPage,
        content: textInput,
        x,
        y,
        fontSize
      }
      
      setAnnotations([...annotations, newAnnotation])
      setTextInput('')
      redrawAnnotations()
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCurrentPath([{ x, y }])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && selectedTool === 'draw') {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newPath = [...currentPath, { x, y }]
      setCurrentPath(newPath)
      
      // Draw in real-time
      const ctx = drawingCanvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      const newAnnotation: Annotation = {
        type: 'drawing',
        pageNumber: currentPage,
        paths: [currentPath]
      }
      setAnnotations([...annotations, newAnnotation])
    }
    setIsDrawing(false)
    setCurrentPath([])
  }

  const clearCurrentPage = () => {
    setAnnotations(annotations.filter(ann => ann.pageNumber !== currentPage))
    redrawAnnotations()
  }

  const handleSave = async () => {
    if (!file) return
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfLibDoc = await PDFDocument.load(arrayBuffer)
      
      // Add annotations to PDF
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = pdfLibDoc.getPages()[pageNum - 1]
        const { height } = page.getSize()
        
        const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNum)
        
        for (const ann of pageAnnotations) {
          if (ann.type === 'text' && ann.content && ann.x && ann.y) {
            page.drawText(ann.content, {
              x: ann.x / (zoom * 1.5),
              y: height - (ann.y / (zoom * 1.5)),
              size: ann.fontSize || 14,
              color: rgb(0, 0, 0)
            })
          } else if (ann.type === 'drawing' && ann.paths) {
            // Draw lines for drawings
            ann.paths.forEach(path => {
              for (let i = 0; i < path.length - 1; i++) {
                const start = path[i]
                const end = path[i + 1]
                page.drawLine({
                  start: { x: start.x / (zoom * 1.5), y: height - (start.y / (zoom * 1.5)) },
                  end: { x: end.x / (zoom * 1.5), y: height - (end.y / (zoom * 1.5)) },
                  thickness: 2,
                  color: rgb(0, 0, 0)
                })
              }
            })
          }
        }
      }
      
      const pdfBytes = await pdfLibDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      setResult(blob)
    } catch (err) {
      console.error('Error saving PDF:', err)
      alert('Failed to save PDF. Please try again.')
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setAnnotations([])
    setPdfDoc(null)
    setCurrentPage(1)
  }

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text, draw, and annotate your PDF documents"
    >
      <div className="max-w-6xl mx-auto">
        {!file ? (
          <FileUpload
            accept={['application/pdf', '.pdf']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFilesSelected}
            className="mb-6"
          />
        ) : !result ? (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Tools */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTool('text')}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedTool === 'text'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Add Text"
                  >
                    <Type className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedTool('draw')}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedTool === 'draw'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Draw"
                  >
                    <Pen className="w-5 h-5" />
                  </button>
                  <button
                    onClick={clearCurrentPage}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Clear Page"
                  >
                    <Eraser className="w-5 h-5" />
                  </button>
                </div>

                {/* Text Input */}
                {selectedTool === 'text' && (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type text to add..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    />
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value={10}>10px</option>
                      <option value={12}>12px</option>
                      <option value={14}>14px</option>
                      <option value={18}>18px</option>
                      <option value={24}>24px</option>
                      <option value={32}>32px</option>
                    </select>
                  </div>
                )}

                {/* Zoom */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Save PDF
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="relative inline-block">
                <canvas ref={canvasRef} className="border border-gray-300 dark:border-gray-600" />
                <canvas
                  ref={drawingCanvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700 dark:text-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              PDF Edited Successfully!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your annotations have been added to the PDF
            </p>
            
            <div className="mb-6">
              <DownloadButton
                file={result}
                filename={file?.name.replace('.pdf', '_edited.pdf') || 'edited.pdf'}
              />
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Edit Another PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
