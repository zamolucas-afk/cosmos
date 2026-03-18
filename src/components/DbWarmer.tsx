'use client'

import { useEffect } from 'react'

/**
 * Invisible component that fires a lightweight DB ping on mount.
 * Placed in the root layout so every page load warms Neon's compute
 * before the user triggers any real query.
 */
export function DbWarmer() {
  useEffect(() => {
    fetch('/api/keepalive').catch(() => {
      // Silent — this is a best-effort warm-up
    })
  }, [])

  return null
}
