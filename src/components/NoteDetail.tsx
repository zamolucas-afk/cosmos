'use client'

import { useState, useTransition, useOptimistic } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Copy, Trash2, ArrowLeft, Check, Heart } from 'lucide-react'
import { deleteNote, toggleFavorite } from '@/lib/actions/notes'
import { formatDuration } from '@/lib/utils'
import NoteDetailTabs from './NoteDetailTabs'
import type { Note } from '@/lib/db/schema'

function buildMarkdown(note: Note): string {
  const lines: string[] = [`# ${note.title}`, '']

  if (note.summary) {
    lines.push('## Summary', '', note.summary, '')
  }

  const actionItems = (note.actionItems ?? []) as { text: string; assignee?: string }[]
  if (actionItems.length > 0) {
    lines.push('## Action Items', '')
    for (const item of actionItems) {
      lines.push(`- ${item.text}${item.assignee ? ` @${item.assignee}` : ''}`)
    }
    lines.push('')
  }

  const keyDecisions = (note.keyDecisions ?? []) as string[]
  if (keyDecisions.length > 0) {
    lines.push('## Key Decisions', '')
    for (const d of keyDecisions) {
      lines.push(`- ${d}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

export default function NoteDetail({ note }: { note: Note }) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(note.isFavorite)

  async function handleCopy() {
    await navigator.clipboard.writeText(buildMarkdown(note))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDelete() {
    startTransition(() => deleteNote(note.id))
  }

  function handleToggleFavorite() {
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite)
      await toggleFavorite(note.id)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All notes
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {note.emoji && (
              <span className="text-3xl leading-none mt-1 shrink-0">{note.emoji}</span>
            )}
            <h1 className="text-3xl font-heading text-text-primary leading-tight">{note.title}</h1>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isPending}
            aria-label={optimisticFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="shrink-0 mt-1 p-1.5 rounded-md text-text-muted hover:text-error transition-colors disabled:opacity-50"
          >
            <Heart
              className="w-5 h-5"
              fill={optimisticFavorite ? 'currentColor' : 'none'}
              color={optimisticFavorite ? '#f87171' : undefined}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 text-text-muted text-sm mb-8">
          <span>{format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}</span>
          <span className="border border-accent-dim/40 rounded-full px-2 py-0.5 text-xs">
            {formatDuration(note.duration)}
          </span>
        </div>

        {/* Tabbed content */}
        <NoteDetailTabs note={note} />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-accent-dim/20">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy summary'}
          </button>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
                text-text-muted hover:text-error text-sm transition-colors border border-accent-dim/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1.5 rounded bg-error/20 text-error text-sm hover:bg-error/30 transition-colors border border-error/30 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded bg-surface text-text-secondary text-sm hover:bg-surface-raised transition-colors border border-accent-dim/30"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/record" className="text-accent-light hover:text-text-primary text-sm transition-colors">
            New Recording →
          </Link>
        </div>
      </div>
    </div>
  )
}
