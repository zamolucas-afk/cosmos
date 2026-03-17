import 'next-auth'

declare module 'next-auth' {
  interface User {
    plan?: 'free' | 'trial' | 'pro'
    trialEndsAt?: Date | null
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: 'free' | 'trial' | 'pro'
      trialEndsAt: string | null
    }
  }
}
