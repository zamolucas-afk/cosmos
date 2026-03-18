'use client'

import { useMemo, useState, useEffect } from 'react'

// Seeded PRNG to generate identical stars on server and client
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export default function StarField() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stars = useMemo(() => {
    const rand = seededRandom(42)
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 2 + 0.5,
      delay: rand() * 4,
      duration: rand() * 3 + 2,
    }))
  }, [])

  if (!mounted) return null

  return (
    <div className="star-field fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-text-primary"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
