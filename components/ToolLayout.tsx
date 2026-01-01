'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

interface ToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Tools</span>
            </Link>
            
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Tool Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {title}
          </h1>
          <p className="text-lg text-gray-600">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Privacy Notice */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto">
          <p className="text-sm text-blue-800">
            <strong>🔒 Privacy First:</strong> All processing happens in your browser. 
            Your files never leave your device and are never uploaded to any server.
          </p>
        </div>
      </div>

      {/* Footer Signature */}
      <footer className="bg-gray-50 border-t py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Made with ❤️ by <strong className="text-primary-600">SB</strong> | 
            <a href="https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools" 
               target="_blank" 
               rel="noopener noreferrer"
               className="ml-1 text-primary-600 hover:text-primary-700 underline">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
