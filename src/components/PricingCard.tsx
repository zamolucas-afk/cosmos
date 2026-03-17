'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { initiateSubscription } from '@/lib/actions/subscription'

type Plan = 'free' | 'pro'

const features = {
  free: ['3 notes / month', 'Cloud sync', 'Claude AI polish', 'Full-text search'],
  pro: ['Unlimited notes', 'Cloud sync', 'Claude AI polish', 'Full-text search', 'Priority processing'],
}

export default function PricingCard({
  plan,
  currentPlan,
}: {
  plan: Plan
  currentPlan: Plan | null
}) {
  const [isPending, startTransition] = useTransition()
  const isPro = plan === 'pro'
  const isCurrent = plan === currentPlan

  return (
    <div className={`rounded-xl p-6 border flex flex-col gap-5 ${
      isPro
        ? 'bg-surface border-accent-violet/50 relative overflow-hidden'
        : 'bg-surface/50 border-accent-dim/30'
    }`}
      style={isPro ? { boxShadow: '0 0 40px #7c3aed22' } : undefined}
    >
      {isPro && (
        <div className="absolute top-3 right-3 text-xs text-accent-light border border-accent-light/30 rounded-full px-2 py-0.5">
          Most popular
        </div>
      )}

      <div>
        <h3 className="font-heading text-xl text-text-primary">{isPro ? 'Pro' : 'Free'}</h3>
        <div className="mt-1">
          <span className="text-3xl font-heading text-text-primary">{isPro ? 'R149' : 'R0'}</span>
          <span className="text-text-muted text-sm">/month</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {features[plan].map(f => (
          <li key={f} className="flex items-center gap-2 text-text-secondary text-sm">
            <Check className="w-4 h-4 text-success shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="mt-auto py-2.5 rounded text-center text-sm text-text-muted border border-accent-dim/30">
          Current plan
        </div>
      ) : isPro ? (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => initiateSubscription())}
          className="mt-auto py-2.5 rounded bg-accent-violet text-white text-sm font-heading
            hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer"
          style={{ boxShadow: '0 0 20px #7c3aed44' }}
        >
          {isPending ? 'Redirecting…' : 'Upgrade to Pro'}
        </button>
      ) : null}
    </div>
  )
}
