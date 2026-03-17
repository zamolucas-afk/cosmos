'use client'

import type React from 'react'

export default function TagPill({ tag, onClick }: { tag: string; onClick?: (e?: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] px-2 py-0.5 rounded-full bg-accent-dim/30 text-accent-light
        border border-accent-dim/20 hover:bg-accent-dim/50 transition-colors cursor-pointer"
    >
      {tag}
    </button>
  )
}
