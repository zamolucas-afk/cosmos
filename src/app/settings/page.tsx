import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import SettingsView from '@/components/SettingsView'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user] = await withRetry(() =>
    db.select({ name: users.name, email: users.email, plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
  )

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SettingsView name={user.name} email={user.email} plan={user.plan} />
    </div>
  )
}
