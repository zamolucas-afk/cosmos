import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/auth.config'

const { auth } = NextAuth(authConfig)

export function proxy(...args: Parameters<typeof auth>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth as any)(...args)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
