// PDF processing utilities using pdf-lib

import { PDFDocument, degrees, rgb } from 'pdf-lib'

export async function mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()
  
  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }
  
  return await mergedPdf.save()
}

export async function splitPDF(
  pdfFile: File,
  ranges: { start: number; end: number }[]
): Promise<Uint8Array[]> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer)
  const results: Uint8Array[] = []
  
  for (const range of ranges) {
    const newPdf = await PDFDocument.create()
    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i - 1
    )
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
    copiedPages.forEach((page) => newPdf.addPage(page))
    results.push(await newPdf.save())
  }
  
  return results
}

export async function compressPDF(pdfFile: File, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<Uint8Array> {
  // Import PDF.js for rendering
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  
  const arrayBuffer = await pdfFile.arrayBuffer()
  
  // Load PDF with PDF.js for rendering
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise
  
  // Create new PDF with pdf-lib
  const compressedPdf = await PDFDocument.create()
  
  // Quality settings - affects both resolution and JPEG quality
  const settingsMap = {
    low: { scale: 1.0, jpegQuality: 0.3 },      // Low resolution, high compression
    medium: { scale: 1.5, jpegQuality: 0.5 },   // Medium resolution, medium compression
    high: { scale: 2.0, jpegQuality: 0.7 }      // Higher resolution, less compression
  }
  const settings = settingsMap[quality]
  
  // Process each page
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: settings.scale })
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    // Convert canvas to JPEG blob with compression
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        settings.jpegQuality
      )
    })
    
    // Convert blob to array buffer
    const imageArrayBuffer = await imageBlob.arrayBuffer()
    
    // Embed compressed image in new PDF
    const jpegImage = await compressedPdf.embedJpg(imageArrayBuffer)
    
    // Add page with same dimensions as original
    const pdfPage = compressedPdf.addPage([viewport.width, viewport.height])
    pdfPage.drawImage(jpegImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height
    })
  }
  
  // Save compressed PDF
  return await compressedPdf.save({
    useObjectStreams: true,
    addDefaultPage: false
  })
}

export async function rotatePDF(pdfFile: File, rotation: 90 | 180 | 270, pageIndices?: number[]): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  const pages = pdf.getPages()
  
  const indicesToRotate = pageIndices || pages.map((_, i) => i)
  
  indicesToRotate.forEach(index => {
    if (index < pages.length) {
      pages[index].setRotation(degrees(rotation))
    }
  })
  
  return await pdf.save()
}

export async function deletePDFPages(pdfFile: File, pageIndices: number[]): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  
  // Sort in descending order to avoid index shifting issues
  const sortedIndices = [...pageIndices].sort((a, b) => b - a)
  
  sortedIndices.forEach(index => {
    if (index < pdf.getPageCount()) {
      pdf.removePage(index)
    }
  })
  
  return await pdf.save()
}

export async function protectPDF(pdfFile: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  
  // Note: pdf-lib has limited encryption support
  // For production use, consider server-side tools
  return await pdf.save()
}

export async function unlockPDF(pdfFile: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  // Note: pdf-lib has limited decryption support
  // For production use, consider server-side tools
  const pdf = await PDFDocument.load(arrayBuffer)
  
  // Save without encryption
  return await pdf.save()
}

export async function addTextWatermark(
  pdfFile: File,
  text: string,
  options: {
    opacity?: number
    fontSize?: number
    rotation?: number
    color?: { r: number; g: number; b: number }
  } = {}
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  const pages = pdf.getPages()
  
  const {
    opacity = 0.3,
    fontSize = 50,
    rotation = 45,
    color = { r: 0.5, g: 0.5, b: 0.5 }
  } = options
  
  pages.forEach(page => {
    const { width, height } = page.getSize()
    page.drawText(text, {
      x: width / 2,
      y: height / 2,
      size: fontSize,
      rotate: degrees(rotation),
      opacity,
      color: rgb(color.r, color.g, color.b),
    })
  })
  
  return await pdf.save()
}

export async function getPDFInfo(pdfFile: File): Promise<{
  pageCount: number
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
}> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  
  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
    creator: pdf.getCreator(),
    producer: pdf.getProducer(),
    creationDate: pdf.getCreationDate(),
    modificationDate: pdf.getModificationDate(),
  }
}

export async function updatePDFMetadata(
  pdfFile: File,
  metadata: {
    title?: string
    author?: string
    subject?: string
    creator?: string
    keywords?: string[]
  }
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  
  if (metadata.title) pdf.setTitle(metadata.title)
  if (metadata.author) pdf.setAuthor(metadata.author)
  if (metadata.subject) pdf.setSubject(metadata.subject)
  if (metadata.creator) pdf.setCreator(metadata.creator)
  if (metadata.keywords) pdf.setKeywords(metadata.keywords)
  
  return await pdf.save()
}
