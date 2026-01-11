// Tool types and configurations

export interface Tool {
  id: string
  name: string
  description: string
  icon: string
  category: 'pdf' | 'image' | 'conversion'
  href: string
  popular?: boolean
  comingSoon?: boolean
}

export const tools: Tool[] = [
  // PDF Tools
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one',
    icon: 'Combine',
    category: 'pdf',
    href: '/tools/merge-pdf',
    popular: true,
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Extract pages from your PDF',
    icon: 'Split',
    category: 'pdf',
    href: '/tools/split-pdf',
    popular: true,
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size',
    icon: 'Minimize2',
    category: 'pdf',
    href: '/tools/compress-pdf',
    popular: true,
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages to JPG or PNG',
    icon: 'FileImage',
    category: 'conversion',
    href: '/tools/pdf-to-image',
    popular: true,
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert images to PDF document',
    icon: 'FileText',
    category: 'conversion',
    href: '/tools/image-to-pdf',
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages',
    icon: 'RotateCw',
    category: 'pdf',
    href: '/tools/rotate-pdf',
  },
  {
    id: 'delete-pages',
    name: 'Delete Pages',
    description: 'Remove pages from PDF',
    icon: 'Trash2',
    category: 'pdf',
    href: '/tools/delete-pages',
  },
  {
    id: 'edit-pdf',
    name: 'Edit PDF',
    description: 'Add text, draw, and annotate PDF',
    icon: 'Edit',
    category: 'pdf',
    href: '/tools/edit-pdf',
    popular: true,
  },
  
  // Image/Icon Tools
  {
    id: 'image-to-ico',
    name: 'Image to ICO',
    description: 'Convert images to Windows icon format',
    icon: 'Image',
    category: 'image',
    href: '/tools/image-to-ico',
    popular: true,
  },
  {
    id: 'ico-to-image',
    name: 'ICO to Image',
    description: 'Convert ICO files to PNG, JPG, etc.',
    icon: 'ImageDown',
    category: 'image',
    href: '/tools/ico-to-image',
    popular: true,
  },
  {
    id: 'compress-image',
    name: 'Compress Image',
    description: 'Reduce image file size with quality control',
    icon: 'Minimize2',
    category: 'image',
    href: '/tools/compress-image',
    popular: true,
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    description: 'Resize images with custom or preset dimensions',
    icon: 'Maximize2',
    category: 'image',
    href: '/tools/resize-image',
    popular: true,
  },
  {
    id: 'convert-image',
    name: 'Convert Image',
    description: 'Convert between PNG, JPG, WebP formats',
    icon: 'RefreshCw',
    category: 'image',
    href: '/tools/convert-image',
    popular: true,
  },
]

export const categories = {
  pdf: { name: 'PDF Tools', color: 'bg-red-100 text-red-700' },
  image: { name: 'Image Tools', color: 'bg-blue-100 text-blue-700' },
  conversion: { name: 'Conversion', color: 'bg-green-100 text-green-700' },
}
