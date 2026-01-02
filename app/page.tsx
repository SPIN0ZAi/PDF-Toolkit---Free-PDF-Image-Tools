import Link from 'next/link'
import { FileText, Shield, Zap, Github } from 'lucide-react'
import ToolsGrid from '@/components/ToolsGrid'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
              <FileText className="w-8 h-8" />
              <span>PDF Toolkit</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Features
              </Link>
              <Link href="#privacy" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Privacy
              </Link>
              <a 
                href="https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free PDF & Image Tools
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 dark:text-primary-200 mb-8 max-w-3xl mx-auto">
            Merge, split, compress, and convert PDFs. Transform images to ICO and back. 
            All processing happens in your browser - 100% private and free.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
            <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 rounded-full px-4 py-2">
              <Shield className="w-5 h-5" />
              <span>No Upload Required</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 rounded-full px-4 py-2">
              <Zap className="w-5 h-5" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 rounded-full px-4 py-2">
              <FileText className="w-5 h-5" />
              <span>100% Free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          Choose Your Tool
        </h2>
        <ToolsGrid />
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            Why Choose PDF Toolkit?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Privacy</h3>
              <p className="text-gray-600">
                All files are processed in your browser. Nothing is uploaded to any server. 
                Your data never leaves your device.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Client-side processing means no waiting in queue. Process your files 
                instantly without network delays.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Limits</h3>
              <p className="text-gray-600">
                Process as many files as you want. No registration, no subscriptions, 
                no hidden fees. Completely free forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Privacy First
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-700 mb-4">
              <strong>Your privacy matters.</strong> PDF Toolkit processes all files directly 
              in your web browser using JavaScript. This means:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Files never leave your computer</li>
              <li>No servers process or store your documents</li>
              <li>No tracking or analytics on your files</li>
              <li>Works offline once the page is loaded</li>
              <li>Open source - you can verify the code</li>
            </ul>
            <p className="text-gray-700">
              We use localStorage only for rate limiting to prevent abuse. No personal data 
              is collected or stored.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-300 mb-1">
                © 2026 PDF Toolkit. Free forever. Open source.
              </p>
              <p className="text-sm text-gray-400">
                Crafted with ❤️ by <strong className="text-primary-400">SB</strong>
              </p>
            </div>
            <div className="flex gap-6">
              <a href="https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools" target="_blank" rel="noopener noreferrer" 
                className="text-gray-300 hover:text-white transition-colors">
                GitHub
              </a>
              <Link href="#privacy" className="text-gray-300 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
