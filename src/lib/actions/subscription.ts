'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateSignature, getPayFastUrl, getPayFastApiUrl, buildApiHeaders } from '@/lib/payfast'
import { redirect } from 'next/navigation'

export async function initiateSubscription(): Promise<never> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user] = await db.select({ name: users.name, email: users.email })
    .from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) redirect('/login')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const mPaymentId = `cosmos_${session.user.id}_${Date.now()}`
  const today = new Date().toISOString().split('T')[0]

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${appUrl}/account?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    notify_url: `${appUrl}/api/payfast/notify`,
    name_first: user.name.split(' ')[0],
    email_address: user.email,
    m_payment_id: mPaymentId,
    amount: '149.00',
    item_name: 'Cosmos Pro — Monthly',
    subscription_type: '1',
    billing_date: today,
    recurring_amount: '149.00',
    frequency: '3',
    cycles: '0',
  }

  params.signature = generateSignature(params, process.env.PAYFAST_PASSPHRASE!)

  const qs = new URLSearchParams(params).toString()
  redirect(`${getPayFastUrl()}?${qs}`)
}

export async function cancelSubscription(): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthenticated' }

  const [sub] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, session.user.id), eq(subscriptions.status, 'active')))
    .limit(1)

  if (!sub) return { error: 'No active subscription found' }

  const apiUrl = `${getPayFastApiUrl()}/subscriptions/${sub.payfastToken}/cancel`
  const headers = buildApiHeaders(`/subscriptions/${sub.payfastToken}/cancel`)

  const res = await fetch(apiUrl, { method: 'POST', headers })
  if (!res.ok) return { error: 'Failed to cancel with PayFast. Please try again.' }

  await db.update(subscriptions)
    .set({ status: 'cancelled', cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id))

  return {}
}
