import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkAndExpireTrial } from '@/lib/trial'
import { withRetry } from '@/lib/utils'
import PricingCard from '@/components/PricingCard'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const session = await auth()

  let currentPlan: 'free' | 'trial' | 'pro' | null = null
  let trialEndsAt: string | null = null

  if (session?.user?.id) {
    // Authoritative plan (handles expired trials)
    currentPlan = await checkAndExpireTrial(session.user.id)

    if (currentPlan === 'trial') {
      const [user] = await withRetry(() =>
        db.select({ trialEndsAt: users.trialEndsAt })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1)
      )
      trialEndsAt = user?.trialEndsAt?.toISOString() ?? null
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {reason === 'limit' && (
        <div
          className="mb-8 max-w-xl w-full bg-accent-violet/10 border border-accent-violet/30
            rounded-lg px-4 py-3 text-center text-text-secondary text-sm"
        >
          You&apos;ve used all your free notes. Upgrade to Pro for unlimited.
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-heading text-text-primary mb-2">Simple pricing</h1>
        <p className="text-text-secondary">Start free. Upgrade when you need more.</p>
      </div>

      <PricingCard currentPlan={currentPlan} trialEndsAt={trialEndsAt} />
    </div>
  )
}
