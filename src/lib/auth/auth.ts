import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { withRetry } from '@/lib/utils'
import { authConfig } from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db) as NextAuthConfig['adapter'],
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        if (!email || !password) return null
        try {
          const [user] = await withRetry(() =>
            db.select().from(users).where(eq(users.email, email)).limit(1)
          )
          if (!user || !user.passwordHash) return null
          const valid = await bcrypt.compare(password, user.passwordHash)
          if (!valid) return null
          return { id: user.id, name: user.name, email: user.email, plan: user.plan as 'free' | 'trial' | 'pro', trialEndsAt: user.trialEndsAt }
        } catch (err) {
          console.error('[authorize] DB query failed:', err)
          return null
        }
      },
    }),
  ],
})
