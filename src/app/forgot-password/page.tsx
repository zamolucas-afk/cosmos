'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/lib/actions/password'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-full mb-4"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 50%, #4c1d95 80%, #2e1065)',
              boxShadow: '0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.3)',
              animation: 'forgot-orb-pulse 3s ease-in-out infinite',
            }}
          />
          <h1 className="text-2xl font-heading text-text-primary">Forgot password?</h1>
          <p className="text-text-secondary text-sm mt-1">Enter your email and we&apos;ll send a reset link</p>
          <style>{`
            @keyframes forgot-orb-pulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.3); }
              50% { transform: scale(1.06); box-shadow: 0 0 50px #a855f7aa, 0 0 100px #7c3aed55, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.4); }
            }
          `}</style>
        </div>

        <form action={action}
          className="bg-surface rounded-lg p-6 flex flex-col gap-4 border border-accent-dim/30">
          {state?.error && (
            <p className="text-error text-sm bg-error/10 rounded px-3 py-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-success text-sm bg-success/10 rounded px-3 py-2">{state.success}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs uppercase tracking-wider">Email</label>
            <input name="email" type="email" required autoComplete="email"
              className="bg-background border border-accent-dim/40 rounded px-3 py-2.5 text-text-primary text-sm
                focus:outline-none focus:border-accent-violet transition-colors placeholder:text-text-muted"
              placeholder="you@example.com" />
          </div>

          <button type="submit" disabled={pending}
            className="mt-2 py-2.5 rounded bg-accent-violet text-white font-heading text-sm
              hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer violet-glow"
            style={{ boxShadow: '0 0 20px #7c3aed44' }}>
            {pending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-4">
          Remember your password?{' '}
          <Link href="/login" className="text-accent-light hover:text-text-primary transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
