import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'
import { getMonthlyNoteCount } from '@/lib/actions/notes'
import RecordingScreen from '@/components/RecordingScreen'

export default async function RecordPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user] = await withRetry(() =>
    db.select({ plan: users.plan }).from(users)
      .where(eq(users.id, session.user.id)).limit(1)
  )
  const plan = user?.plan ?? 'free'

  if (plan === 'free') {
    const count = await getMonthlyNoteCount(session.user.id)
    if (count >= 10) redirect('/pricing?reason=limit')
  }

  return <RecordingScreen />
}
