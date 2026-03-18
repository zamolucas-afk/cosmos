'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { polishNote } from '@/lib/claude'
import { withRetry } from '@/lib/utils'
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

  // Authoritative limit check — read plan directly from DB (with retry for Neon cold starts)
  let user: { plan: string; trialStartedAt: Date | null } | undefined
  try {
    const [result] = await withRetry(() =>
      db.select({ plan: users.plan, trialStartedAt: users.trialStartedAt })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)
    )
    user = result
  } catch (err) {
    console.error('[saveNote] DB plan check failed:', err)
    throw new Error('Could not verify your account. Please try again.')
  }
  if (!user) throw new Error('User not found')

  if (user.plan === 'trial') {
    const trialStartedAt = user.trialStartedAt ?? new Date(0)
    const trialCount = await withRetry(() => getTrialNoteCount(session.user.id, trialStartedAt))
    if (trialCount >= 20) throw new Error('Trial note limit reached. Upgrade to Pro for unlimited notes.')
  } else if (user.plan === 'free') {
    const noteCount = await withRetry(() => getMonthlyNoteCount(session.user.id))
    if (noteCount >= 3) throw new Error('Monthly note limit reached. Upgrade to Pro for unlimited notes.')
  }
  // plan === 'pro': no limit

  // Polish with Claude — fallback to raw transcript if AI fails
  let title: string, emoji: string, polished: string, summary: string
  let actionItems: { text: string; assignee?: string }[], keyDecisions: string[], tags: string[]

  try {
    const result = await polishNote(rawTranscript)
    title = result.title
    emoji = result.emoji
    polished = result.polished
    summary = result.summary
    actionItems = result.actionItems
    keyDecisions = result.keyDecisions
    tags = result.tags
  } catch (err) {
    console.error('[saveNote] polishNote failed:', err)
    // Save with fallback rather than losing the user's recording
    title = 'Voice Note'
    emoji = '📝'
    polished = rawTranscript
    summary = ''
    actionItems = []
    keyDecisions = []
    tags = []
  }

  try {
    const [note] = await withRetry(() =>
      db.insert(notes).values({
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
    )

    return { id: note.id }
  } catch (err) {
    console.error('[saveNote] DB insert failed:', err)
    throw new Error('Failed to save note. Please try again.')
  }
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

export async function repolishNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthenticated' }

  const [note] = await db.select({ id: notes.id, rawTranscript: notes.rawTranscript })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .limit(1)

  if (!note) return { success: false, error: 'Note not found' }

  try {
    const { title, emoji, polished, summary, actionItems, keyDecisions, tags } = await polishNote(note.rawTranscript)

    await db.update(notes).set({
      title,
      emoji,
      polishedTranscript: polished,
      summary,
      actionItems,
      keyDecisions,
      tags,
      updatedAt: new Date(),
    }).where(eq(notes.id, noteId))

    return { success: true }
  } catch {
    return { success: false, error: 'AI processing failed. Please try again.' }
  }
}

export async function renameNote(noteId: string, newTitle: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthenticated' }

  const trimmed = newTitle.trim()
  if (!trimmed || trimmed.length > 200) return { success: false, error: 'Title must be 1-200 characters' }

  try {
    const result = await withRetry(() =>
      db.update(notes)
        .set({ title: trimmed, updatedAt: new Date() })
        .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
        .returning({ id: notes.id })
    )
    if (result.length === 0) return { success: false, error: 'Note not found' }
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to rename. Please try again.' }
  }
}

export async function generateShareLink(noteId: string): Promise<{ url: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthenticated' }

  const [note] = await withRetry(() =>
    db.select({ id: notes.id, shareToken: notes.shareToken })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
      .limit(1)
  )
  if (!note) return { error: 'Note not found' }

  if (note.shareToken) {
    return { url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${note.shareToken}` }
  }

  const token = crypto.randomUUID()
  await withRetry(() =>
    db.update(notes)
      .set({ shareToken: token, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
  )
  return { url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}` }
}

export async function revokeShareLink(noteId: string): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false }
  await withRetry(() =>
    db.update(notes)
      .set({ shareToken: null, updatedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
  )
  return { success: true }
}
