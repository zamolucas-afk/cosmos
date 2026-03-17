'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { initiateSubscription } from '@/lib/actions/subscription'

type UserPlan = 'free' | 'trial' | 'pro'

const proFeatures = [
  'Unlimited notes',
  'AI Insights (summary, actions, decisions)',
  'Ask Your Notes',
  'Smart Collections',
  'Favorites & Search',
]

const freeFeatures = [
  '3 notes / month',
  'Basic features',
]

export default function PricingCard({
  currentPlan,
  trialEndsAt,
}: {
  currentPlan: UserPlan | null
  trialEndsAt: string | null
}) {
  const [isPending, startTransition] = useTransition()

  const isTrial = currentPlan === 'trial'
  const isPro = currentPlan === 'pro'

  let trialDaysLeft = 0
  if (isTrial && trialEndsAt) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
  }

  return (
    <div className="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Free card */}
      <div className="rounded-xl p-6 border bg-surface/50 border-accent-dim/30 flex flex-col gap-5">
        <div>
          <h3 className="font-heading text-xl text-text-primary">Free</h3>
          <div className="mt-1">
            <span className="text-3xl font-heading text-text-primary">R0</span>
            <span className="text-text-muted text-sm">/month</span>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {freeFeatures.map(f => (
            <li key={f} className="flex items-center gap-2 text-text-secondary text-sm">
              <Check className="w-4 h-4 text-success shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {currentPlan === 'free' && (
          <div className="mt-auto py-2.5 rounded text-center text-sm text-text-muted border border-accent-dim/30">
            Current plan
          </div>
        )}
      </div>

      {/* Pro card */}
      <div
        className="rounded-xl p-6 border bg-surface border-accent-violet/50 flex flex-col gap-5 relative overflow-hidden"
        style={{ boxShadow: '0 0 40px #7c3aed22' }}
      >
        <div className="absolute top-3 right-3 text-xs text-accent-light border border-accent-light/30 rounded-full px-2 py-0.5">
          Most popular
        </div>

        <div>
          <h3 className="font-heading text-xl text-text-primary">Pro</h3>
          <div className="mt-1">
            <span className="text-3xl font-heading text-text-primary">R149</span>
            <span className="text-text-muted text-sm">/month</span>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {proFeatures.map(f => (
            <li key={f} className="flex items-center gap-2 text-text-secondary text-sm">
              <Check className="w-4 h-4 text-success shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="mt-auto py-2.5 rounded text-center text-sm text-text-muted border border-accent-dim/30">
            Current plan
          </div>
        ) : isTrial ? (
          <div className="mt-auto flex flex-col gap-2">
            <div className="py-2 rounded text-center text-sm text-accent-light border border-accent-light/30">
              Trial active — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
            </div>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => initiateSubscription())}
              className="py-2.5 rounded bg-accent-violet text-white text-sm font-heading
                hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer"
              style={{ boxShadow: '0 0 20px #7c3aed44' }}
            >
              {isPending ? 'Redirecting…' : 'Subscribe now — R149/month'}
            </button>
          </div>
        ) : (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => initiateSubscription())}
            className="mt-auto py-2.5 rounded bg-accent-violet text-white text-sm font-heading
              hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer"
            style={{ boxShadow: '0 0 20px #7c3aed44' }}
          >
            {isPending ? 'Redirecting…' : 'Start 7-day free trial'}
          </button>
        )}
      </div>
    </div>
  )
}
