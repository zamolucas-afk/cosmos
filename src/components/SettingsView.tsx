'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Globe, Info, Shield, FileText, CreditCard, LogOut, Mail } from 'lucide-react'
import { updateProfile, toggleDigest } from '@/lib/actions/settings'
import { signOutAction } from '@/lib/actions/auth'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsView({ name, email, plan, digestEnabled }: { name: string; email: string; plan: string; digestEnabled: boolean }) {
  const router = useRouter()
  const [editName, setEditName] = useState(name)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { theme, toggleTheme } = useTheme()
  const [digestOn, setDigestOn] = useState(digestEnabled)

  function handleSave() {
    if (editName.trim() === name) {
      setIsEditing(false)
      return
    }
    startTransition(async () => {
      const result = await updateProfile(editName)
      if (result.success) {
        setSaved(true)
        setIsEditing(false)
        setTimeout(() => setSaved(false), 2000)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold text-text-primary mb-8">Settings</h1>

      {saved && (
        <div className="mb-4 p-3 rounded-xl bg-success/10 text-success text-sm">
          Profile updated successfully
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-4">Profile</h2>
        <div className="bg-surface rounded-2xl border border-accent-dim/20 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-accent-dim/10">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-accent-light" />
              <div>
                <p className="text-xs text-text-muted">Name</p>
                {isEditing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditName(name); setIsEditing(false) } }}
                    onBlur={handleSave}
                    autoFocus
                    className="bg-transparent border-b border-accent-violet text-text-primary text-sm outline-none w-48"
                  />
                ) : (
                  <p className="text-text-primary text-sm">{name}</p>
                )}
              </div>
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-accent-light text-xs hover:underline">
                Edit
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 p-4">
            <Globe className="w-5 h-5 text-accent-light" />
            <div>
              <p className="text-xs text-text-muted">Email</p>
              <p className="text-text-primary text-sm">{email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-8">
        <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-4">Preferences</h2>
        <div className="bg-surface rounded-2xl border border-accent-dim/20 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-accent-dim/10">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-accent-light" />
              <div>
                <p className="text-text-primary text-sm">Language</p>
                <p className="text-xs text-text-muted">English (South Africa)</p>
              </div>
            </div>
            <span className="text-text-muted text-xs">en-ZA</span>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-accent-dim/10">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-accent-light" />
              <div>
                <p className="text-text-primary text-sm">Theme</p>
                <p className="text-xs text-text-muted">
                  {theme === 'deep-space' ? 'Deep Space (dark)' : 'Cloud (light)'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg bg-surface-raised text-text-secondary text-xs font-heading hover:text-text-primary transition-colors"
            >
              {theme === 'deep-space' ? '\u2600\uFE0F Cloud' : '\uD83C\uDF19 Deep Space'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-accent-light" />
              <div>
                <p className="text-text-primary text-sm">Weekly Digest</p>
                <p className="text-xs text-text-muted">
                  {digestOn ? 'AI summary of your notes every week' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                startTransition(async () => {
                  const result = await toggleDigest()
                  if (result.success && result.enabled !== undefined) {
                    setDigestOn(result.enabled)
                  }
                })
              }}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading transition-colors ${
                digestOn
                  ? 'bg-accent-violet/20 text-accent-light hover:bg-accent-violet/30'
                  : 'bg-surface-raised text-text-secondary hover:text-text-primary'
              }`}
            >
              {digestOn ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-8">
        <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-4">About</h2>
        <div className="bg-surface rounded-2xl border border-accent-dim/20 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-accent-dim/10">
            <Info className="w-5 h-5 text-accent-light" />
            <div>
              <p className="text-text-primary text-sm">Cosmos</p>
              <p className="text-xs text-text-muted">Version 2.5 · AI Voice Note Taker</p>
            </div>
          </div>
          <Link href="/privacy" className="flex items-center gap-3 p-4 border-b border-accent-dim/10 hover:bg-surface-raised/50 transition-colors">
            <Shield className="w-5 h-5 text-accent-light" />
            <p className="text-text-primary text-sm">Privacy Policy</p>
          </Link>
          <Link href="/terms" className="flex items-center gap-3 p-4 hover:bg-surface-raised/50 transition-colors">
            <FileText className="w-5 h-5 text-accent-light" />
            <p className="text-text-primary text-sm">Terms of Use</p>
          </Link>
        </div>
      </section>

      {/* Account & Sign Out */}
      <section className="mb-8">
        <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-4">Account</h2>
        <div className="bg-surface rounded-2xl border border-accent-dim/20 overflow-hidden">
          <Link href="/account" className="flex items-center gap-3 p-4 border-b border-accent-dim/10 hover:bg-surface-raised/50 transition-colors">
            <CreditCard className="w-5 h-5 text-accent-light" />
            <div>
              <p className="text-text-primary text-sm">Subscription & Billing</p>
              <p className="text-xs text-text-muted">{plan.charAt(0).toUpperCase() + plan.slice(1)} plan</p>
            </div>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 p-4 w-full text-left hover:bg-surface-raised/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-error/70" />
              <p className="text-error/90 text-sm">Sign out</p>
            </button>
          </form>
        </div>
      </section>

      <p className="text-center text-text-muted text-xs mt-12">
        Made with 💜 in South Africa
      </p>
    </main>
  )
}
