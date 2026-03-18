import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'
import NoteDetail from '@/components/NoteDetail'
import { markViewed } from '@/lib/actions/notes'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [note] = await withRetry(() =>
    db.select().from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .limit(1)
  )

  if (!note) notFound()

  // Fire-and-forget — don't block page render
  markViewed(note.id).catch(() => {})

  return <NoteDetail note={note} />
}
