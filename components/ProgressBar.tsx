'use client'

interface ProgressBarProps {
  progress: number
  status?: string
  className?: string
}

export default function ProgressBar({ progress, status, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {status && (
        <p className="text-sm font-medium text-gray-700 mb-2">{status}</p>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          <div className="h-full w-full bg-white/30 animate-pulse" />
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-1 text-right">
        {Math.round(progress)}%
      </p>
    </div>
  )
}
