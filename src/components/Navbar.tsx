import Link from 'next/link'
import { auth } from '@/lib/auth/auth'
import { signOutAction } from '@/lib/actions/auth'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'

function getFirstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default async function Navbar() {
  const session = await auth()
  if (!session?.user) return null

  const plan = session.user.plan

  let usedThisMonth = 0
  if (plan === 'free') {
    const result = await db.select({ count: count() }).from(notes)
      .where(and(eq(notes.userId, session.user.id), gte(notes.createdAt, getFirstDayOfMonth())))
    usedThisMonth = result[0]?.count ?? 0
  }

  return (
    <nav className="border-b border-accent-dim/20 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent-violet"
            style={{ boxShadow: '0 0 12px #7c3aed88' }} />
          <span className="font-heading text-text-primary font-semibold">Cosmos</span>
        </Link>

        <div className="flex items-center gap-3">
          {plan === 'free' ? (
            <Link href="/pricing"
              className="text-xs text-text-secondary hover:text-accent-light transition-colors border border-accent-dim/40 rounded-full px-3 py-1">
              Free {usedThisMonth}/10
            </Link>
          ) : (
            <span className="text-xs text-accent-light border border-accent-light/30 rounded-full px-3 py-1">
              Pro
            </span>
          )}
          <Link href="/account" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
            Account
          </Link>
          <form action={signOutAction as unknown as (formData: FormData) => Promise<void>}>
            <button type="submit" className="text-text-muted hover:text-error text-sm transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
