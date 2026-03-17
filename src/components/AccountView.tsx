'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { cancelSubscription } from '@/lib/actions/subscription'

type UserPlan = 'free' | 'trial' | 'pro'

type Props = {
  user: { name: string; email: string; plan: UserPlan }
  subscription: { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string } | null
  usedCount: number
  trialEndsAt: string | null
  upgraded: boolean
}

export default function AccountView({ user, subscription, usedCount, trialEndsAt, upgraded }: Props) {
  const [showBanner, setShowBanner] = useState(upgraded)
  const [confirming, setConfirming] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelSubscription()
      if (result.error) {
        setCancelError(result.error)
      } else {
        setConfirming(false)
        window.location.reload()
      }
    })
  }

  let trialDaysLeft = 0
  if (user.plan === 'trial' && trialEndsAt) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {showBanner && (
        <div className="mb-6 bg-success/10 border border-success/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-success text-sm">You&apos;re now on Cosmos Pro. Enjoy unlimited notes!</p>
          <button
            onClick={() => setShowBanner(false)}
            className="text-text-muted hover:text-text-primary text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <h1 className="text-2xl font-heading text-text-primary mb-8">Account</h1>

      {/* Profile */}
      <section className="bg-surface rounded-lg p-5 border border-accent-dim/20 mb-4">
        <h2 className="text-text-secondary text-xs uppercase tracking-wider mb-3">Profile</h2>
        <p className="text-text-primary">{user.name}</p>
        <p className="text-text-secondary text-sm">{user.email}</p>
      </section>

      {/* Subscription */}
      <section className="bg-surface rounded-lg p-5 border border-accent-dim/20">
        <h2 className="text-text-secondary text-xs uppercase tracking-wider mb-4">Subscription</h2>

        {user.plan === 'trial' ? (
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-accent-light font-heading"
                style={{ textShadow: '0 0 8px #a855f744' }}
              >
                Trial · {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </span>
              <p className="text-text-secondary text-sm mt-0.5">{usedCount}/20 notes used</p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded bg-accent-violet text-white text-sm hover:bg-accent-light transition-colors"
              style={{ boxShadow: '0 0 16px #7c3aed44' }}
            >
              Subscribe now
            </Link>
          </div>
        ) : user.plan === 'free' ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-text-primary">Free plan</span>
              <p className="text-text-secondary text-sm mt-0.5">{usedCount}/3 notes used this month</p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded bg-accent-violet text-white text-sm hover:bg-accent-light transition-colors"
              style={{ boxShadow: '0 0 16px #7c3aed44' }}
            >
              Upgrade
            </Link>
          </div>
        ) : subscription?.cancelAtPeriodEnd ? (
          <div>
            <p className="text-text-primary">
              Pro plan — active until {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
            </p>
            <p className="text-text-muted text-sm mt-1">Your subscription has been cancelled.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-accent-light">Pro plan</span>
              {subscription && (
                <p className="text-text-secondary text-sm mt-0.5">
                  Next billing: {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                </p>
              )}
            </div>
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="text-text-muted hover:text-error text-sm transition-colors cursor-pointer"
              >
                Cancel subscription
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {cancelError && <p className="text-error text-xs">{cancelError}</p>}
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded bg-error/20 text-error text-sm border border-error/30 hover:bg-error/30 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isPending ? 'Cancelling…' : 'Confirm cancel'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-1.5 rounded bg-surface-raised text-text-secondary text-sm border border-accent-dim/30 hover:bg-accent-dim/20 transition-colors cursor-pointer"
                >
                  Keep Pro
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
