import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'

export async function checkAndExpireTrial(userId: string): Promise<'trial' | 'free' | 'pro'> {
  const [user] = await withRetry(() =>
    db.select({ plan: users.plan, trialEndsAt: users.trialEndsAt })
      .from(users).where(eq(users.id, userId)).limit(1)
  )

  if (!user || user.plan !== 'trial') return (user?.plan as 'free' | 'pro') ?? 'free'

  if (user.trialEndsAt && user.trialEndsAt <= new Date()) {
    const [sub] = await db.select({ status: subscriptions.status })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)

    const newPlan = sub ? 'pro' : 'free'
    await db.update(users).set({ plan: newPlan }).where(eq(users.id, userId))
    return newPlan
  }

  return 'trial'
}
