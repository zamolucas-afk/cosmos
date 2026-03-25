'use client'

import { useState, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { resetPasswordAction } from '@/lib/actions/password'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-heading text-text-primary mb-2">Invalid link</h1>
          <p className="text-text-secondary text-sm mb-6">This password reset link is invalid or missing a token.</p>
          <Link href="/forgot-password" className="text-accent-light hover:text-text-primary transition-colors text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-full mb-4"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 50%, #4c1d95 80%, #2e1065)',
              boxShadow: '0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.3)',
              animation: 'reset-orb-pulse 3s ease-in-out infinite',
            }}
          />
          <h1 className="text-2xl font-heading text-text-primary">Set new password</h1>
          <p className="text-text-secondary text-sm mt-1">Enter your new password below</p>
          <style>{`
            @keyframes reset-orb-pulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.3); }
              50% { transform: scale(1.06); box-shadow: 0 0 50px #a855f7aa, 0 0 100px #7c3aed55, inset 0 -4px 12px rgba(0,0,0,0.4), inset 0 4px 8px rgba(192,132,252,0.4); }
            }
          `}</style>
        </div>

        {state?.success ? (
          <div className="bg-surface rounded-lg p-6 flex flex-col gap-4 border border-accent-dim/30 text-center">
            <p className="text-success text-sm bg-success/10 rounded px-3 py-2">{state.success}</p>
            <Link href="/login"
              className="mt-2 py-2.5 rounded bg-accent-violet text-white font-heading text-sm text-center
                hover:bg-accent-light transition-colors block"
              style={{ boxShadow: '0 0 20px #7c3aed44' }}>
              Sign in
            </Link>
          </div>
        ) : (
          <form action={action}
            className="bg-surface rounded-lg p-6 flex flex-col gap-4 border border-accent-dim/30">
            {state?.error && (
              <p className="text-error text-sm bg-error/10 rounded px-3 py-2">{state.error}</p>
            )}

            <input type="hidden" name="token" value={token} />

            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary text-xs uppercase tracking-wider">New password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
                  className="w-full bg-background border border-accent-dim/40 rounded px-3 py-2.5 pr-10 text-text-primary text-sm
                    focus:outline-none focus:border-accent-violet transition-colors placeholder:text-text-muted"
                  placeholder="8+ characters" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={pending}
              className="mt-2 py-2.5 rounded bg-accent-violet text-white font-heading text-sm
                hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer violet-glow"
              style={{ boxShadow: '0 0 20px #7c3aed44' }}>
              {pending ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        <p className="text-center text-text-secondary text-sm mt-4">
          <Link href="/login" className="text-accent-light hover:text-text-primary transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
