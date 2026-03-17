import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkAndExpireTrial } from '@/lib/trial'
import { getMonthlyNoteCount, getTrialNoteCount } from '@/lib/actions/notes'
import AccountView from '@/components/AccountView'
import Navbar from '@/components/Navbar'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Authoritative plan — also expires stale trials
  const plan = await checkAndExpireTrial(session.user.id)

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) redirect('/login')

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  // Compute usage count based on authoritative plan
  let usedCount = 0
  let trialEndsAt: string | null = null

  if (plan === 'trial') {
    const trialStartedAt = user.trialStartedAt ?? new Date(0)
    usedCount = await getTrialNoteCount(user.id, trialStartedAt)
    trialEndsAt = user.trialEndsAt?.toISOString() ?? null
  } else if (plan === 'free') {
    usedCount = await getMonthlyNoteCount(user.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AccountView
        user={{ name: user.name, email: user.email, plan }}
        subscription={
          sub
            ? {
                status: sub.status,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              }
            : null
        }
        usedCount={usedCount}
        trialEndsAt={trialEndsAt}
        upgraded={upgraded === 'true'}
      />
    </div>
  )
}
