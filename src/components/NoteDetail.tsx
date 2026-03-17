'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Copy, Trash2, ArrowLeft, Check } from 'lucide-react'
import { deleteNote } from '@/lib/actions/notes'
import { formatDuration } from '@/lib/utils'
import type { Note } from '@/lib/db/schema'

export default function NoteDetail({ note }: { note: Note }) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleCopy() {
    await navigator.clipboard.writeText(note.polishedTranscript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDelete() {
    startTransition(() => deleteNote(note.id))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All notes
        </Link>

        <h1 className="text-3xl font-heading text-text-primary mb-3">{note.title}</h1>

        <div className="flex items-center gap-3 text-text-muted text-sm mb-8">
          <span>{format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}</span>
          <span className="border border-accent-dim/40 rounded-full px-2 py-0.5 text-xs">
            {formatDuration(note.duration)}
          </span>
        </div>

        <div className="text-text-secondary leading-[1.75] whitespace-pre-wrap mb-12">
          {note.polishedTranscript}
        </div>

        <div className="flex items-center gap-3 pt-6 border-t border-accent-dim/20">
          <button onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {!confirming ? (
            <button onClick={() => setConfirming(true)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
                text-text-muted hover:text-error text-sm transition-colors border border-accent-dim/30">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">Are you sure?</span>
              <button onClick={handleDelete} disabled={isPending}
                className="px-3 py-1.5 rounded bg-error/20 text-error text-sm hover:bg-error/30 transition-colors border border-error/30 disabled:opacity-50">
                {isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded bg-surface text-text-secondary text-sm hover:bg-surface-raised transition-colors border border-accent-dim/30">
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/record"
            className="text-accent-light hover:text-text-primary text-sm transition-colors">
            New Recording →
          </Link>
        </div>
      </div>
    </div>
  )
}
