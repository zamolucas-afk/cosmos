import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

/**
 * Lightweight endpoint to keep Neon's serverless compute warm.
 * Called by:
 * 1. Client-side on app load (preemptive warm-up)
 * 2. External cron (e.g., UptimeRobot, cron-job.org) every 4 min to prevent scale-to-zero
 */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
