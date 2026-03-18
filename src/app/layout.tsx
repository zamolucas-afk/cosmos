import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { DbWarmer } from '@/components/DbWarmer'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cosmos — AI Voice Note Taker',
  description: 'Your voice, distilled.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-text-primary font-body transition-colors duration-300">
        <ThemeProvider>
          <DbWarmer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
