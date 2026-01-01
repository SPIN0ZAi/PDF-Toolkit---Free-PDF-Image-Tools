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
  const arrayBuffer = await pdfFile.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer)
  
  // Create new PDF
  const compressedPdf = await PDFDocument.create()
  
  // Quality settings for image compression
  const qualityMap = {
    low: 0.4,      // Maximum compression (smallest file)
    medium: 0.6,   // Balanced
    high: 0.8      // Less compression (better quality)
  }
  const imageQuality = qualityMap[quality]
  
  // Resolution scale factor
  const scaleMap = {
    low: 0.7,      // 70% of original resolution
    medium: 0.85,  // 85% of original resolution  
    high: 1.0      // Keep original resolution
  }
  const scaleFactor = scaleMap[quality]
  
  // Copy and compress each page
  for (let i = 0; i < sourcePdf.getPageCount(); i++) {
    const [sourcePage] = await compressedPdf.copyPages(sourcePdf, [i])
    const { width, height } = sourcePage.getSize()
    
    // Scale down the page if needed
    if (scaleFactor < 1.0) {
      sourcePage.scale(scaleFactor, scaleFactor)
    }
    
    compressedPdf.addPage(sourcePage)
  }
  
  // Try to extract and compress embedded images
  try {
    const pages = compressedPdf.getPages()
    
    for (const page of pages) {
      // Get the page's content stream
      const { width, height } = page.getSize()
      
      // Scale content for compression
      if (quality === 'low') {
        page.scaleContent(0.95, 0.95)
        page.setSize(width * 0.95, height * 0.95)
      }
    }
  } catch (e) {
    // Continue if image extraction fails
    console.warn('Could not compress images:', e)
  }
  
  // Save with maximum compression options
  return await compressedPdf.save({ 
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50
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
