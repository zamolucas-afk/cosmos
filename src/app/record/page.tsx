import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getMonthlyNoteCount } from '@/lib/actions/notes'
import RecordingScreen from '@/components/RecordingScreen'

async function getUserPlan(userId: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const [user] = await db.select({ plan: users.plan }).from(users)
        .where(eq(users.id, userId)).limit(1)
      return user?.plan ?? 'free'
    } catch (e) {
      if (i === retries) throw e
    }
  }
  return 'free'
}

export default async function RecordPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const plan = await getUserPlan(session.user.id)

  if (plan === 'free') {
    const count = await getMonthlyNoteCount(session.user.id)
    if (count >= 10) redirect('/pricing?reason=limit')
  }

  return <RecordingScreen />
}
