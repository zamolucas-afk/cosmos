import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    plan?: 'free' | 'trial' | 'pro'
    trialEndsAt?: Date | null
  }
  interface Session {
    user: {
      id: string
      plan: 'free' | 'trial' | 'pro'
      trialEndsAt: string | null
    } & DefaultSession['user']
  }
}
