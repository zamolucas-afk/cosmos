import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { withRetry } from '@/lib/utils'
import SharedNoteView from '@/components/SharedNoteView'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const [note] = await db.select({ title: notes.title, summary: notes.summary, emoji: notes.emoji })
    .from(notes).where(eq(notes.shareToken, token)).limit(1)
  if (!note) return { title: 'Note not found' }
  return {
    title: `${note.emoji ?? ''} ${note.title} — Cosmos`,
    description: note.summary ?? 'A voice note from Cosmos',
    openGraph: { title: `${note.emoji ?? ''} ${note.title}`, description: note.summary ?? 'A voice note from Cosmos' },
  }
}

export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [note] = await withRetry(() =>
    db.select().from(notes).where(eq(notes.shareToken, token)).limit(1)
  )
  if (!note) notFound()
  return <SharedNoteView note={note} />
}
