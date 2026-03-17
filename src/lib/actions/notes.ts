'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { polishNote } from '@/lib/claude'
import { redirect } from 'next/navigation'

function startOfMonth(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getMonthlyNoteCount(userId: string): Promise<number> {
  const result = await db.select({ count: count() }).from(notes)
    .where(and(eq(notes.userId, userId), gte(notes.createdAt, startOfMonth())))
  return result[0]?.count ?? 0
}

export async function getTrialNoteCount(userId: string, trialStartedAt: Date): Promise<number> {
  const result = await db.select({ count: count() }).from(notes)
    .where(and(eq(notes.userId, userId), gte(notes.createdAt, trialStartedAt)))
  return result[0]?.count ?? 0
}

export async function saveNote(rawTranscript: string, duration: number): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  // Authoritative limit check — read plan directly from DB
  const [user] = await db.select({ plan: users.plan, trialStartedAt: users.trialStartedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
  if (!user) throw new Error('User not found')

  if (user.plan === 'trial') {
    const trialStartedAt = user.trialStartedAt ?? new Date(0)
    const count = await getTrialNoteCount(session.user.id, trialStartedAt)
    if (count >= 20) throw new Error('Trial note limit reached. Upgrade to Pro for unlimited notes.')
  } else if (user.plan === 'free') {
    const noteCount = await getMonthlyNoteCount(session.user.id)
    if (noteCount >= 3) throw new Error('Monthly note limit reached. Upgrade to Pro for unlimited notes.')
  }
  // plan === 'pro': no limit

  const { title, emoji, polished, summary, actionItems, keyDecisions, tags } = await polishNote(rawTranscript)

  const [note] = await db.insert(notes).values({
    userId: session.user.id,
    title,
    emoji,
    rawTranscript,
    polishedTranscript: polished,
    summary,
    actionItems,
    keyDecisions,
    tags,
    duration,
    viewed: false,
  }).returning({ id: notes.id })

  return { id: note.id }
}

export async function deleteNote(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
  redirect('/')
}

export async function toggleFavorite(noteId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  // Fetch current isFavorite state (ownership check included)
  const [note] = await db.select({ isFavorite: notes.isFavorite })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .limit(1)
  if (!note) throw new Error('Note not found')

  await db.update(notes)
    .set({ isFavorite: !note.isFavorite, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
}

export async function markViewed(noteId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  // Only update if not already viewed (idempotent)
  await db.update(notes)
    .set({ viewed: true, updatedAt: new Date() })
    .where(and(
      eq(notes.id, noteId),
      eq(notes.userId, session.user.id),
      eq(notes.viewed, false),
    ))
}
