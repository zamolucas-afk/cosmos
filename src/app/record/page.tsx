import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getMonthlyRecordingCount } from '@/lib/actions/notes'
import RecordingScreen from '@/components/RecordingScreen'

export default async function RecordPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user] = await db.select({ plan: users.plan }).from(users)
    .where(eq(users.id, session.user.id)).limit(1)

  if (user?.plan === 'free') {
    const count = await getMonthlyRecordingCount(session.user.id)
    if (count >= 10) redirect('/pricing?reason=limit')
  }

  return <RecordingScreen />
}
