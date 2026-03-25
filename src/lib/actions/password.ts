'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'
import { sendEmail } from '@/lib/email/send'

type ActionState = { error?: string; success?: string } | undefined

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function forgotPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = forgotSchema.safeParse({ email: formData.get('email') })
  if (!result.success) return { error: result.error.issues[0].message }

  const email = result.data.email

  try {
    const [user] = await withRetry(() =>
      db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    )

    // Always show success to prevent email enumeration
    if (!user) return { success: 'If an account with that email exists, we sent a password reset link.' }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await withRetry(() =>
      db.update(users).set({ resetToken: token, resetTokenExpiresAt: expiresAt }).where(eq(users.id, user.id))
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Reset your Cosmos password',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: #0d0d1a; border-radius: 12px; padding: 32px; color: #f0f0ff;">
          <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; text-align: center; margin-bottom: 8px;">Reset your password</h1>
          <p style="color: #9090b0; text-align: center; font-size: 14px; margin-bottom: 24px;">Click the button below to set a new password for your Cosmos account.</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reset Password</a>
          </div>
          <p style="color: #50507a; font-size: 12px; text-align: center;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    })
  } catch {
    // Silently fail — don't reveal whether email exists
  }

  return { success: 'If an account with that email exists, we sent a password reset link.' }
}

export async function resetPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { token, password } = result.data

  try {
    const [user] = await withRetry(() =>
      db.select({ id: users.id })
        .from(users)
        .where(and(eq(users.resetToken, token), gt(users.resetTokenExpiresAt, new Date())))
        .limit(1)
    )

    if (!user) return { error: 'This reset link is invalid or has expired. Please request a new one.' }

    const passwordHash = await bcrypt.hash(password, 12)

    await withRetry(() =>
      db.update(users)
        .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
        .where(eq(users.id, user.id))
    )

    return { success: 'Password reset successfully. You can now sign in.' }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
