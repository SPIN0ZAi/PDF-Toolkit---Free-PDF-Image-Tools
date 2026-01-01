import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF Toolkit - Free PDF & Image Tools',
  description: 'Free online tools to merge, split, compress, convert PDFs and images. No registration required. 100% privacy-focused.',
  keywords: ['PDF tools', 'merge PDF', 'split PDF', 'compress PDF', 'PDF converter', 'image to ICO', 'ICO converter'],
  authors: [{ name: 'PDF Toolkit' }],
  openGraph: {
    title: 'PDF Toolkit - Free PDF & Image Tools',
    description: 'Free online tools to merge, split, compress, convert PDFs and images.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {children}
      </body>
    </html>
  )
}
