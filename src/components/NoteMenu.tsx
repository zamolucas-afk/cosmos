'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Pencil } from 'lucide-react'

export default function NoteMenu({
  onFavorite,
  onDelete,
  isFavorite,
  onShare,
  onRename,
}: {
  onFavorite: () => void
  onDelete: () => void
  isFavorite: boolean
  onShare?: () => void
  onRename?: () => void
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
          {onShare && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-accent-dim/20 cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          {onRename && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-accent-dim/20 cursor-pointer flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Rename
            </button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-accent-dim/20 cursor-pointer"
          >
            {isFavorite ? '★ Unfavorite' : '☆ Favorite'}
          </button>
          <div className="border-t border-accent-dim/20 my-1" />
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
