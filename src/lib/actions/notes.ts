'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { polishNote } from '@/lib/claude'
import { redirect } from 'next/navigation'

function startOfMonth(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getMonthlyRecordingCount(userId: string): Promise<number> {
  const result = await db.select({ id: notes.id }).from(notes)
    .where(and(eq(notes.userId, userId), gte(notes.createdAt, startOfMonth())))
  return result.length
}

export async function saveNote(rawTranscript: string, duration: number): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  // Authoritative limit check — read plan directly from DB
  const [user] = await db.select({ plan: users.plan }).from(users)
    .where(eq(users.id, session.user.id)).limit(1)
  if (!user) throw new Error('User not found')

  if (user.plan === 'free') {
    const count = await getMonthlyRecordingCount(session.user.id)
    if (count >= 10) throw new Error('Monthly recording limit reached. Upgrade to Pro for unlimited recordings.')
  }

  const { title, polished } = await polishNote(rawTranscript)

  const [note] = await db.insert(notes).values({
    userId: session.user.id,
    title,
    rawTranscript,
    polishedTranscript: polished,
    duration,
  }).returning({ id: notes.id })

  return { id: note.id }
}

export async function deleteNote(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
  redirect('/')
}
