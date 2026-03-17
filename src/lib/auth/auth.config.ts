import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = ['/login', '/register', '/pricing'].some(p =>
        nextUrl.pathname.startsWith(p)
      ) || nextUrl.pathname.startsWith('/api/auth')
        || nextUrl.pathname.startsWith('/api/payfast')
      if (isPublic) return true
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan ?? 'free'
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.plan = (token.plan as 'free' | 'pro') ?? 'free'
      return session
    },
  },
  providers: [],
}
