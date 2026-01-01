// PDF to Image conversion utilities using PDF.js

import * as pdfjsLib from 'pdfjs-dist'

// Set worker path
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export interface PDFPageImage {
  blob: Blob
  pageNumber: number
  width: number
  height: number
}

// Convert PDF pages to images
export async function pdfToImages(
  pdfFile: File,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.92,
  scale: number = 2.0
): Promise<PDFPageImage[]> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  const images: PDFPageImage[] = []
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b!),
        format === 'png' ? 'image/png' : 'image/jpeg',
        quality
      )
    })
    
    images.push({
      blob,
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
    })
  }
  
  return images
}

// Get PDF page count
export async function getPDFPageCount(pdfFile: File): Promise<number> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  return pdf.numPages
}
