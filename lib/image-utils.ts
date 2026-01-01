// Image and ICO conversion utilities

export interface IcoSize {
  width: number
  height: number
}

export const COMMON_ICO_SIZES: IcoSize[] = [
  { width: 16, height: 16 },
  { width: 24, height: 24 },
  { width: 32, height: 32 },
  { width: 48, height: 48 },
  { width: 64, height: 64 },
  { width: 128, height: 128 },
  { width: 256, height: 256 },
]

// Convert image to ICO format with multiple sizes
export async function imageToICO(
  imageFile: File,
  sizes: IcoSize[] = [{ width: 32, height: 32 }]
): Promise<Blob> {
  // Create an image element to load the file
  const img = await loadImage(imageFile)
  
  // Generate ICO file with multiple sizes
  const icoData = await generateICO(img, sizes)
  
  return new Blob([icoData], { type: 'image/x-icon' })
}

// Load image from file
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

// Generate ICO file data
async function generateICO(img: HTMLImageElement, sizes: IcoSize[]): Promise<ArrayBuffer> {
  const images: ArrayBuffer[] = []
  
  // Create PNG images for each size
  for (const size of sizes) {
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Draw image scaled to size
    ctx.drawImage(img, 0, 0, size.width, size.height)
    
    // Get PNG data
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })
    
    const buffer = await blob.arrayBuffer()
    images.push(buffer)
  }
  
  // Build ICO file structure
  return buildICOFile(images, sizes)
}

// Build ICO file format
function buildICOFile(images: ArrayBuffer[], sizes: IcoSize[]): ArrayBuffer {
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = headerSize + dirEntrySize * images.length
  
  // Calculate total size
  const totalSize = dirSize + images.reduce((sum, img) => sum + img.byteLength, 0)
  
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  
  // ICO Header
  view.setUint16(0, 0, true) // Reserved
  view.setUint16(2, 1, true) // Type: 1 for ICO
  view.setUint16(4, images.length, true) // Number of images
  
  // Directory entries
  let offset = dirSize
  for (let i = 0; i < images.length; i++) {
    const entryOffset = headerSize + i * dirEntrySize
    const size = sizes[i]
    const imageData = images[i]
    
    bytes[entryOffset] = size.width === 256 ? 0 : size.width
    bytes[entryOffset + 1] = size.height === 256 ? 0 : size.height
    bytes[entryOffset + 2] = 0 // Color palette
    bytes[entryOffset + 3] = 0 // Reserved
    view.setUint16(entryOffset + 4, 1, true) // Color planes
    view.setUint16(entryOffset + 6, 32, true) // Bits per pixel
    view.setUint32(entryOffset + 8, imageData.byteLength, true) // Image size
    view.setUint32(entryOffset + 12, offset, true) // Image offset
    
    // Copy image data
    bytes.set(new Uint8Array(imageData), offset)
    offset += imageData.byteLength
  }
  
  return buffer
}

// Extract images from ICO file
export async function icoToImages(icoFile: File): Promise<{ blob: Blob; width: number; height: number }[]> {
  const buffer = await icoFile.arrayBuffer()
  const view = new DataView(buffer)
  
  // Read ICO header
  const reserved = view.getUint16(0, true)
  const type = view.getUint16(2, true)
  const count = view.getUint16(4, true)
  
  if (reserved !== 0 || type !== 1) {
    throw new Error('Invalid ICO file format')
  }
  
  const images: { blob: Blob; width: number; height: number }[] = []
  
  // Read directory entries
  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16
    
    const width = view.getUint8(entryOffset) || 256
    const height = view.getUint8(entryOffset + 1) || 256
    const imageSize = view.getUint32(entryOffset + 8, true)
    const imageOffset = view.getUint32(entryOffset + 12, true)
    
    // Extract image data
    const imageData = buffer.slice(imageOffset, imageOffset + imageSize)
    
    // Determine format (PNG or BMP)
    const pngSignature = [0x89, 0x50, 0x4E, 0x47]
    const isPNG = pngSignature.every((byte, index) => 
      new Uint8Array(imageData)[index] === byte
    )
    
    const mimeType = isPNG ? 'image/png' : 'image/bmp'
    const blob = new Blob([imageData], { type: mimeType })
    
    images.push({ blob, width, height })
  }
  
  return images
}

// Convert ICO to PNG
export async function icoToPNG(icoFile: File, sizeIndex: number = 0): Promise<Blob> {
  const images = await icoToImages(icoFile)
  
  if (images.length === 0) {
    throw new Error('No images found in ICO file')
  }
  
  const image = images[sizeIndex] || images[0]
  
  // If already PNG, return as is
  if (image.blob.type === 'image/png') {
    return image.blob
  }
  
  // Convert BMP to PNG using canvas
  const img = await loadImageFromBlob(image.blob)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}
