'use client'

import { useState, useTransition, useOptimistic, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Copy, Trash2, ArrowLeft, Check, Heart, Pencil, Share2, Printer, FileDown, Link2 } from 'lucide-react'
import { deleteNote, toggleFavorite, renameNote, generateShareLink, revokeShareLink } from '@/lib/actions/notes'
import { shareNote } from '@/lib/share'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(note.isFavorite)
  const [isRenaming, setIsRenaming] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [shareStatus, setShareStatus] = useState<null | 'shared' | 'copied'>(null)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'copied' | 'active'>(
    note.shareToken ? 'active' : 'idle'
  )
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Auto-enter rename mode if ?rename=true in URL
  useEffect(() => {
    if (searchParams.get('rename') === 'true') {
      setIsRenaming(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  function handleStartRename() {
    setEditTitle(note.title)
    setIsRenaming(true)
  }

  function handleCancelRename() {
    setIsRenaming(false)
    setEditTitle(note.title)
  }

  function handleConfirmRename() {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === note.title) {
      handleCancelRename()
      return
    }
    setIsRenaming(false)
    startTransition(async () => {
      await renameNote(note.id, trimmed)
      router.refresh()
    })
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirmRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  async function handleGetLink() {
    setLinkStatus('loading')
    const result = await generateShareLink(note.id)
    if ('url' in result) {
      await navigator.clipboard.writeText(result.url)
      setLinkStatus('copied')
      setTimeout(() => setLinkStatus('active'), 2000)
    } else {
      setLinkStatus('idle')
    }
  }

  async function handleRevokeLink() {
    await revokeShareLink(note.id)
    setLinkStatus('idle')
    router.refresh()
  }

  async function handleShare() {
    const result = await shareNote(note as Parameters<typeof shareNote>[0])
    setShareStatus(result)
    setTimeout(() => setShareStatus(null), 2000)
  }

  async function handleExport() {
    const { exportNoteAsDocx } = await import('@/lib/export-docx')
    await exportNoteAsDocx(note)
  }

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
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors no-print"
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
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleConfirmRename}
                onKeyDown={handleRenameKeyDown}
                className="bg-transparent border-b-2 border-accent-violet text-text-primary font-heading text-2xl md:text-3xl w-full outline-none"
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-3xl font-heading text-text-primary leading-tight">{note.title}</h1>
                <button
                  onClick={handleStartRename}
                  aria-label="Rename note"
                  className="shrink-0 no-print"
                >
                  <Pencil className="w-5 h-5 text-text-muted hover:text-accent-light cursor-pointer" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isPending}
            aria-label={optimisticFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="shrink-0 mt-1 p-1.5 rounded-md text-text-muted hover:text-error transition-colors disabled:opacity-50 no-print"
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
        <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-accent-dim/20 no-print">
          <button
            onClick={handleGetLink}
            disabled={linkStatus === 'loading'}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30
              disabled:opacity-50"
          >
            {linkStatus === 'copied' ? (
              <><Check className="w-4 h-4 text-success" />Link copied!</>
            ) : linkStatus === 'active' ? (
              <><Link2 className="w-4 h-4 text-accent-light" />Copy link</>
            ) : linkStatus === 'loading' ? (
              <><Link2 className="w-4 h-4 animate-pulse" />Getting link...</>
            ) : (
              <><Link2 className="w-4 h-4" />Get link</>
            )}
          </button>

          {linkStatus === 'active' && (
            <button
              onClick={handleRevokeLink}
              className="flex items-center gap-2 px-3 py-2 rounded bg-surface hover:bg-surface-raised
                text-text-muted hover:text-error text-xs transition-colors border border-accent-dim/30"
            >
              Revoke link
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy summary'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded bg-surface hover:bg-surface-raised
              text-text-secondary hover:text-text-primary text-sm transition-colors border border-accent-dim/30"
          >
            <FileDown className="w-4 h-4" />
            Export
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

        {shareStatus && (
          <p className="text-success text-sm mt-2">
            {shareStatus === 'shared' ? 'Shared!' : 'Copied to clipboard!'}
          </p>
        )}

        <div className="mt-8 no-print">
          <Link
            href="/record"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm
              bg-accent-violet/10 text-accent-light border border-accent-violet/30
              hover:bg-accent-violet/20 hover:border-accent-violet/50 transition-all font-heading"
          >
            New Note →
          </Link>
        </div>
      </div>
    </div>
  )
}
