'use client'

import { useEffect, useRef } from 'react'

const BAR_COUNT = 20

export default function Waveform({
  analyser,
  active,
}: {
  analyser: AnalyserNode | null
  active: boolean
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !analyser) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const data = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      analyser!.getByteFrequencyData(data)
      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const index = Math.floor((i / BAR_COUNT) * data.length * 0.5)
        const value = data[index] / 255
        const height = Math.max(4, value * 60)
        bar.style.height = `${height}px`
        bar.style.opacity = String(0.4 + value * 0.6)
      })
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser, active])

  return (
    <div className="flex items-center justify-center gap-1 h-16" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el }}
          className="w-1 rounded-full bg-accent-light transition-all duration-75"
          style={{
            height: '4px',
            opacity: 0.4,
            animation: active ? 'none' : `wave-idle ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave-idle {
          0%, 100% { height: 4px; opacity: 0.3; }
          50% { height: 12px; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
