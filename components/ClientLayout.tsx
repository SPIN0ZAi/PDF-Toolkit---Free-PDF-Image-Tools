'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import DarkModeToggle from '@/components/DarkModeToggle'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DarkModeToggle />
      {children}
    </ThemeProvider>
  )
}
