import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import AccountView from '@/components/AccountView'
import Navbar from '@/components/Navbar'
import { getMonthlyRecordingCount } from '@/lib/actions/notes'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) redirect('/login')

  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  const usedThisMonth = user.plan === 'free' ? await getMonthlyRecordingCount(user.id) : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AccountView
        user={{ name: user.name, email: user.email, plan: user.plan as 'free' | 'pro' }}
        subscription={sub ? {
          status: sub.status,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        } : null}
        usedThisMonth={usedThisMonth}
        upgraded={upgraded === 'true'}
      />
    </div>
  )
}
