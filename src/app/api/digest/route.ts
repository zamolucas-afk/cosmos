import { db } from '@/lib/db'
import { users, notes } from '@/lib/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { withRetry } from '@/lib/utils'
import { generateWeeklyDigest } from '@/lib/email/digest-ai'
import { buildDigestHtml } from '@/lib/email/digest-template'
import { sendDigestEmail } from '@/lib/email/send'
import { format, subDays } from 'date-fns'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAgo = subDays(now, 7)
  const weekLabel = `${format(weekAgo, 'MMM d')} \u2013 ${format(now, 'MMM d, yyyy')}`

  // Get users with digest enabled
  const digestUsers = await withRetry(() =>
    db.select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.digestEnabled, true))
  )

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of digestUsers) {
    try {
      // Fetch user's notes from last 7 days
      const userNotes = await withRetry(() =>
        db.select({
          title: notes.title,
          summary: notes.summary,
          actionItems: notes.actionItems,
          keyDecisions: notes.keyDecisions,
          tags: notes.tags,
        }).from(notes)
          .where(and(eq(notes.userId, user.id), gte(notes.createdAt, weekAgo)))
          .orderBy(desc(notes.createdAt))
      )

      if (userNotes.length === 0) {
        skipped++
        continue
      }

      // Generate AI digest
      const digest = await generateWeeklyDigest(userNotes)

      // Build and send email
      const html = buildDigestHtml({
        userName: user.name,
        weekLabel,
        summary: digest.summary,
        noteCount: userNotes.length,
        topActionItems: digest.topActionItems,
        themes: digest.themes,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://cosmosainotetaker.netlify.app',
      })

      await sendDigestEmail({
        to: user.email,
        subject: `\uD83D\uDFE3 Your Cosmos Weekly \u2014 ${weekLabel}`,
        html,
      })

      // Update last sent timestamp
      await withRetry(() =>
        db.update(users).set({ lastDigestSentAt: now }).where(eq(users.id, user.id))
      )

      sent++
    } catch (err) {
      errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return Response.json({ sent, skipped, errors: errors.length, errorDetails: errors })
}
