import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import NoteDetail from '@/components/NoteDetail'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [note] = await db.select().from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
    .limit(1)

  if (!note) notFound()

  return <NoteDetail note={note} />
}
