'use client'

import ToolLayout from '@/components/ToolLayout'

export default function ProtectPDFPage() {
  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ Feature Currently Unavailable
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            PDF encryption is not fully supported in browser environments due to security limitations.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Recommended alternatives:</strong>
          </p>
          <ul className="text-sm text-yellow-600 dark:text-yellow-400 ml-4 mt-2 space-y-1 list-disc">
            <li>Use Adobe Acrobat or similar desktop software</li>
            <li>Use command-line tools like <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">qpdf</code> or <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">pdftk</code></li>
            <li>Use online services that support server-side encryption</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
