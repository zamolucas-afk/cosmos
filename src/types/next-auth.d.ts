import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      plan: 'free' | 'pro'
    } & DefaultSession['user']
  }
  interface User {
    id: string
    plan: 'free' | 'pro'
  }
}
