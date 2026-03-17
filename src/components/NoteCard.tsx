'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { startTransition } from 'react'
import { formatDuration, cn } from '@/lib/utils'
import { toggleFavorite, deleteNote } from '@/lib/actions/notes'
import NoteMenu from '@/components/NoteMenu'
import TagPill from '@/components/TagPill'
import type { Note } from '@/lib/db/schema'

export default function NoteCard({ note }: { note: Note }) {
  const excerpt = note.polishedTranscript.length > 120
    ? note.polishedTranscript.slice(0, 120) + '…'
    : note.polishedTranscript

  const createdAt = new Date(note.createdAt)
  const timeLabel = format(createdAt, 'h:mm a')
  const tags = note.tags ?? []

  function handleFavorite() {
    startTransition(() => {
      toggleFavorite(note.id)
    })
  }

  function handleDelete() {
    startTransition(() => {
      deleteNote(note.id)
    })
  }

  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn(
        'block bg-surface hover:bg-surface-raised border border-accent-dim/20',
        'hover:border-accent-dim/50 rounded-lg p-4 transition-all group',
        'hover:border-l-2 hover:border-l-accent-violet',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Emoji avatar */}
        <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl
          bg-surface-raised border border-accent-dim/20 text-2xl select-none">
          {note.emoji ?? '📝'}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-text-primary font-heading font-semibold truncate
              group-hover:text-accent-light transition-colors">
              {note.title}
            </h3>

            {/* Right controls: unread dot, favorite star, menu */}
            <div className="flex items-center gap-1 shrink-0">
              {!note.viewed && (
                <span
                  className="w-2 h-2 rounded-full bg-accent-violet shrink-0"
                  aria-label="Unread"
                />
              )}
              {note.isFavorite && (
                <span className="text-accent-light text-sm" aria-label="Favorited">★</span>
              )}
              <NoteMenu
                isFavorite={note.isFavorite}
                onFavorite={handleFavorite}
                onDelete={handleDelete}
              />
            </div>
          </div>

          {/* Meta: time · duration */}
          <p className="text-text-muted text-xs mt-0.5">
            {timeLabel}
            <span className="mx-1">·</span>
            {formatDuration(note.duration)}
          </p>

          {/* Excerpt */}
          <p
            data-testid="note-excerpt"
            className="text-text-secondary text-sm mt-1.5 leading-relaxed line-clamp-2"
          >
            {excerpt}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
