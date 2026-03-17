'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signIn, signOut } from '@/lib/auth/auth'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function validateRegisterInput(input: unknown) {
  return registerSchema.safeParse(input)
}

export async function registerAction(formData: FormData) {
  const result = validateRegisterInput({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const [existing] = await db.select().from(users).where(eq(users.email, result.data.email)).limit(1)
  if (existing) return { error: 'An account with this email already exists' }

  const passwordHash = await bcrypt.hash(result.data.password, 12)
  await db.insert(users).values({ name: result.data.name, email: result.data.email, passwordHash, plan: 'free' })

  await signIn('credentials', { email: result.data.email, password: result.data.password, redirectTo: '/' })
}

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/',
    })
  } catch {
    return { error: 'Invalid email or password' }
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
