import { NextRequest, NextResponse } from 'next/server'
import { db, poolDb } from '@/lib/db'
import { users, subscriptions, payments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyItnSignature } from '@/lib/payfast'

const PAYFAST_IPS = [
  '41.74.179.194', '41.74.179.195', '41.74.179.196',
  '196.33.227.224', '196.33.227.225',  // sandbox IPs
  '::1', '127.0.0.1',  // allow localhost in dev
]

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1'

  if (!PAYFAST_IPS.includes(clientIp) && process.env.PAYFAST_SANDBOX !== 'true') {
    return new NextResponse('Forbidden', { status: 400 })
  }

  const body = await request.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  // Verify signature
  if (!verifyItnSignature(params, process.env.PAYFAST_PASSPHRASE!)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // Verify merchant
  if (params.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
    return new NextResponse('Invalid merchant', { status: 400 })
  }

  // Verify amount
  if (parseFloat(params.amount) !== 149.00) {
    return new NextResponse('Amount mismatch', { status: 400 })
  }

  const status = params.payment_status
  const userId = params.m_payment_id?.split('_')[1]
  if (!userId) return new NextResponse('Missing user ID', { status: 400 })

  if (status === 'COMPLETE') {
    const payfastPaymentId = params.pf_payment_id ?? `${userId}_${Date.now()}`
    const token = params.token

    // Idempotency: skip if payment already recorded
    const existing = await db.select({ id: payments.id }).from(payments)
      .where(eq(payments.payfastPaymentId, payfastPaymentId)).limit(1)
    if (existing.length > 0) return new NextResponse('OK', { status: 200 })

    const [existingSub] = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await poolDb.transaction(async (tx) => {
      if (!existingSub && token) {
        await tx.insert(subscriptions).values({
          userId,
          payfastToken: token,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
        await tx.update(users).set({ plan: 'pro' }).where(eq(users.id, userId))
      } else if (existingSub) {
        await tx.update(subscriptions).set({
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        }).where(eq(subscriptions.id, existingSub.id))
      }

      await tx.insert(payments).values({
        userId,
        subscriptionId: existingSub?.id,
        amountCents: 14900,
        payfastPaymentId,
        status: 'complete',
      }).onConflictDoNothing()
    })
  } else if (status === 'CANCELLED') {
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId)).limit(1)

    if (sub) {
      const now = new Date()
      const isPastPeriod = sub.currentPeriodEnd <= now
      await db.update(subscriptions).set({
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        updatedAt: now,
      }).where(eq(subscriptions.id, sub.id))

      if (isPastPeriod) {
        await db.update(users).set({ plan: 'free' }).where(eq(users.id, userId))
      }
    }
  } else if (status === 'FAILED') {
    const payfastPaymentId = params.pf_payment_id ?? `${userId}_failed_${Date.now()}`
    await db.insert(payments).values({
      userId,
      amountCents: 14900,
      payfastPaymentId,
      status: 'failed',
    }).onConflictDoNothing()
  }
  // PENDING: no action

  return new NextResponse('OK', { status: 200 })
}
