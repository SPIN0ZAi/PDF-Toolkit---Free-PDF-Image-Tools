'use client'

import ToolLayout from '@/components/ToolLayout'

export default function WatermarkPDFPage() {
  return (
    <ToolLayout
      title="Add Watermark"
      description="Add text watermark to your PDF"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🚧 Coming Soon
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            This feature is currently under development and will be available soon!
          </p>
        </div>
      </div>
    </ToolLayout>
  )
}
