// Utility functions for file handling and validation

export const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '50') * 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    }
  }
  return { valid: true }
}

export function validateFileType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const mimeType = file.type.toLowerCase()
  
  const isValid = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileExtension === type.slice(1)
    }
    return mimeType === type || mimeType.startsWith(type.split('/')[0])
  })
  
  if (!isValid) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}

export function sanitizeFilename(filename: string): string {
  // Remove unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200) // Limit length
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = sanitizeFilename(filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Rate limiting using localStorage
const RATE_LIMIT_KEY = 'pdf_toolkit_rate_limit'
const RATE_LIMIT_PER_HOUR = parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT_PER_HOUR || '100')

interface RateLimitData {
  count: number
  resetTime: number
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetIn: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const now = Date.now()
    
    let data: RateLimitData = stored ? JSON.parse(stored) : { count: 0, resetTime: now + 3600000 }
    
    // Reset if time expired
    if (now >= data.resetTime) {
      data = { count: 0, resetTime: now + 3600000 }
    }
    
    const remaining = RATE_LIMIT_PER_HOUR - data.count
    const resetIn = data.resetTime - now
    
    if (data.count >= RATE_LIMIT_PER_HOUR) {
      return { allowed: false, remaining: 0, resetIn }
    }
    
    return { allowed: true, remaining, resetIn }
  } catch (error) {
    // If localStorage is not available, allow the request
    return { allowed: true, remaining: RATE_LIMIT_PER_HOUR, resetIn: 3600000 }
  }
}

export function incrementRateLimit() {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const now = Date.now()
    
    let data: RateLimitData = stored ? JSON.parse(stored) : { count: 0, resetTime: now + 3600000 }
    
    if (now >= data.resetTime) {
      data = { count: 1, resetTime: now + 3600000 }
    } else {
      data.count += 1
    }
    
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Rate limiting unavailable:', error)
  }
}
