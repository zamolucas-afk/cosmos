'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'

export async function toggleDigest(): Promise<{ success: boolean; enabled?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false }

  const [user] = await withRetry(() =>
    db.select({ digestEnabled: users.digestEnabled })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
  )
  if (!user) return { success: false }

  const newValue = !user.digestEnabled
  await withRetry(() =>
    db.update(users)
      .set({ digestEnabled: newValue })
      .where(eq(users.id, session.user.id))
  )
  return { success: true, enabled: newValue }
}

export async function updateProfile(name: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthenticated' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 100) return { success: false, error: 'Name must be 1-100 characters' }

  try {
    await withRetry(() =>
      db.update(users).set({ name: trimmed }).where(eq(users.id, session.user.id))
    )
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update. Please try again.' }
  }
}
