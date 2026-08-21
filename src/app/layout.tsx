import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Nihongo Studio — Japanese Learning Platform',
    template: '%s | Nihongo Studio',
  },
  description:
    'Master Japanese from absolute zero to advanced. Search, learn, practice, and receive AI-powered guidance on your journey to Japanese fluency.',
  keywords: ['Japanese learning', 'JLPT', 'learn Japanese', 'nihongo', 'kanji', 'hiragana'],
  openGraph: {
    title: 'Nihongo Studio',
    description: 'Complete Japanese learning ecosystem — dictionary, lessons, AI tutor',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  )
}
