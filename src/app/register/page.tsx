'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/lib/actions/auth'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block w-12 h-12 rounded-full bg-accent-violet mb-4 violet-glow"
            style={{ boxShadow: '0 0 32px #7c3aed88' }} />
          <h1 className="text-2xl font-heading text-text-primary">Create account</h1>
          <p className="text-text-secondary text-sm mt-1">Start taking voice notes</p>
        </div>

        <form action={action}
          className="bg-surface rounded-lg p-6 flex flex-col gap-4 border border-accent-dim/30">
          {state?.error && (
            <p className="text-error text-sm bg-error/10 rounded px-3 py-2">{state.error}</p>
          )}

          {(['name', 'email', 'password'] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-text-secondary text-xs uppercase tracking-wider">
                {field === 'name' ? 'Full name' : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                name={field}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required
                autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : 'new-password'}
                className="bg-background border border-accent-dim/40 rounded px-3 py-2.5 text-text-primary text-sm
                  focus:outline-none focus:border-accent-violet transition-colors placeholder:text-text-muted"
                placeholder={field === 'name' ? 'Your name' : field === 'email' ? 'you@example.com' : '8+ characters'}
              />
            </div>
          ))}

          <button type="submit" disabled={pending}
            className="mt-2 py-2.5 rounded bg-accent-violet text-white font-heading text-sm
              hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer violet-glow"
            style={{ boxShadow: '0 0 20px #7c3aed44' }}>
            {pending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-light hover:text-text-primary transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
