import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, collectionSummaries } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tag: encodedTag } = await params
  const tag = decodeURIComponent(encodedTag)
  const userId = session.user.id

  // Check cache
  const [cached] = await db
    .select()
    .from(collectionSummaries)
    .where(
      and(
        eq(collectionSummaries.userId, userId),
        eq(collectionSummaries.tag, tag)
      )
    )
    .limit(1)

  if (cached) {
    // Find the latest note with this tag
    const [latestNote] = await db
      .select({ createdAt: notes.createdAt })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          sql`${notes.tags} @> ARRAY[${tag}]::text[]`
        )
      )
      .orderBy(desc(notes.createdAt))
      .limit(1)

    // Cache is valid if generated after the latest note
    if (!latestNote || cached.generatedAt >= latestNote.createdAt) {
      return NextResponse.json({ summary: cached.summary })
    }
  }

  // Load top 5 notes for this tag
  const tagNotes = await db
    .select({
      title: notes.title,
      summary: notes.summary,
      polishedTranscript: notes.polishedTranscript,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        sql`${notes.tags} @> ARRAY[${tag}]::text[]`
      )
    )
    .orderBy(desc(notes.createdAt))
    .limit(5)

  if (tagNotes.length === 0) {
    return NextResponse.json({ summary: null })
  }

  const noteSummaries = tagNotes
    .map((n, i) => {
      const body = n.summary ?? n.polishedTranscript.slice(0, 300)
      return `Note ${i + 1}: ${n.title}\n${body}`
    })
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    temperature: 0,
    messages: [{
      role: 'user',
      content: `Summarize the common themes across these notes about "${tag}":\n\n${noteSummaries}`,
    }],
  })

  const summaryText =
    response.content[0]?.type === 'text' ? response.content[0].text : null

  if (summaryText) {
    await db
      .insert(collectionSummaries)
      .values({
        tag,
        userId,
        summary: summaryText,
        generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [collectionSummaries.userId, collectionSummaries.tag],
        set: { summary: summaryText, generatedAt: new Date() },
      })
  }

  return NextResponse.json({ summary: summaryText })
}
