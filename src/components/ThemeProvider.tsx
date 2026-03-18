'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Theme, THEME_KEY } from '@/lib/theme'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'deep-space',
  toggleTheme: () => {},
})

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('deep-space')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    if (stored === 'cloud' || stored === 'deep-space') {
      setTheme(stored)
      document.documentElement.dataset.theme = stored
    }
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'deep-space' ? 'cloud' : 'deep-space'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.dataset.theme = next
  }

  // Prevent flash of wrong theme
  useEffect(() => {
    if (mounted) {
      document.documentElement.dataset.theme = theme
    }
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
