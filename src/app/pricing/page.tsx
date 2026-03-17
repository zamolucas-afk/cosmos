import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import PricingCard from '@/components/PricingCard'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const session = await auth()
  let currentPlan: 'free' | 'pro' | null = null

  if (session?.user?.id) {
    const [user] = await db.select({ plan: users.plan }).from(users)
      .where(eq(users.id, session.user.id)).limit(1)
    currentPlan = (user?.plan as 'free' | 'pro') ?? null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {reason === 'limit' && (
        <div className="mb-8 max-w-xl w-full bg-accent-violet/10 border border-accent-violet/30
          rounded-lg px-4 py-3 text-center text-text-secondary text-sm">
          You&apos;ve used all 10 free recordings this month. Upgrade for unlimited.
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-heading text-text-primary mb-2">Simple pricing</h1>
        <p className="text-text-secondary">Start free. Upgrade when you need more.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        <PricingCard plan="free" currentPlan={currentPlan} />
        <PricingCard plan="pro" currentPlan={currentPlan} />
      </div>
    </div>
  )
}
