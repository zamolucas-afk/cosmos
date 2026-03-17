'use client'

import { useState, useRef, useEffect } from 'react'

export default function NoteMenu({
  onFavorite,
  onDelete,
  isFavorite,
}: {
  onFavorite: () => void
  onDelete: () => void
  isFavorite: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open) }}
        className="text-text-muted hover:text-text-secondary p-1 cursor-pointer"
        aria-label="Note options"
      >
        •••
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-surface-raised border border-accent-dim/30 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-accent-dim/20 cursor-pointer"
          >
            {isFavorite ? '★ Unfavorite' : '☆ Favorite'}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
