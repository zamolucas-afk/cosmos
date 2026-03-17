import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { formatDuration } from '@/lib/utils'
import type { Note } from '@/lib/db/schema'

export default function NoteCard({ note }: { note: Note }) {
  const excerpt = note.polishedTranscript.length > 120
    ? note.polishedTranscript.slice(0, 120) + '…'
    : note.polishedTranscript

  return (
    <Link href={`/notes/${note.id}`}
      className="block bg-surface hover:bg-surface-raised border border-accent-dim/20
        hover:border-accent-dim/50 rounded-lg p-4 transition-all group
        hover:border-l-2 hover:border-l-accent-violet">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-text-primary font-heading font-semibold group-hover:text-accent-light transition-colors">
          {note.title}
        </h3>
        <span className="shrink-0 text-xs text-text-muted border border-accent-dim/30 rounded-full px-2 py-0.5">
          {formatDuration(note.duration)}
        </span>
      </div>
      <p data-testid="note-excerpt" className="text-text-secondary text-sm mt-1.5 leading-relaxed">
        {excerpt}
      </p>
      <p className="text-text-muted text-xs mt-2">
        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
      </p>
    </Link>
  )
}
