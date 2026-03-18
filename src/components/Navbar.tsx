import Link from 'next/link'
import { Settings } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { checkAndExpireTrial } from '@/lib/trial'

function getFirstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default async function Navbar() {
  const session = await auth()
  if (!session?.user) return null

  // Check for expired trial and get authoritative plan
  const plan = await checkAndExpireTrial(session.user.id)

  let usedCount = 0
  let trialDaysLeft = 0

  try {
    if (plan === 'trial') {
      const [user] = await db
        .select({ trialStartedAt: users.trialStartedAt, trialEndsAt: users.trialEndsAt })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (user?.trialStartedAt) {
        const result = await db
          .select({ count: count() })
          .from(notes)
          .where(and(eq(notes.userId, session.user.id), gte(notes.createdAt, user.trialStartedAt)))
        usedCount = result[0]?.count ?? 0
      }

      if (user?.trialEndsAt) {
        trialDaysLeft = Math.max(
          0,
          Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      }
    } else if (plan === 'free') {
      const result = await db
        .select({ count: count() })
        .from(notes)
        .where(and(eq(notes.userId, session.user.id), gte(notes.createdAt, getFirstDayOfMonth())))
      usedCount = result[0]?.count ?? 0
    }
  } catch {
    // Neon cold-start can fail — show 0 rather than crashing the page
  }

  return (
    <nav className="border-b border-accent-dim/20 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full bg-accent-violet violet-glow"
            style={{ boxShadow: '0 0 12px #7c3aed88' }}
          />
          <span className="font-heading text-text-primary font-semibold">Cosmos</span>
        </Link>

        <div className="flex items-center gap-3">
          {plan === 'trial' ? (
            <Link
              href="/pricing"
              className="text-xs text-accent-light border border-accent-violet/50 rounded-full px-3 py-1
                hover:border-accent-light/60 transition-colors"
              style={{ boxShadow: '0 0 8px #7c3aed44' }}
            >
              Trial {usedCount}/20 &middot; {trialDaysLeft}d left
            </Link>
          ) : plan === 'free' ? (
            <Link
              href="/pricing"
              className="text-xs text-text-secondary hover:text-accent-light transition-colors border border-accent-dim/40 rounded-full px-3 py-1"
            >
              Free {usedCount}/3
            </Link>
          ) : (
            <span className="text-xs text-accent-light border border-accent-light/30 rounded-full px-3 py-1">
              Pro
            </span>
          )}

          <Link
            href="/settings"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
