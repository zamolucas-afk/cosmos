import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sql, eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { checkAndExpireTrial } from '@/lib/trial'
import { withRetry } from '@/lib/utils'
import { format } from 'date-fns'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const plan = await checkAndExpireTrial(userId)

  // Rate limit: free users get 5 asks/day
  if (plan === 'free') {
    const [user] = await withRetry(() => db
      .select({ dailyAskCount: users.dailyAskCount, lastAskDate: users.lastAskDate })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    )

    const now = new Date()
    const sameDay = user?.lastAskDate ? isSameDay(new Date(user.lastAskDate), now) : false
    const count = sameDay ? (user?.dailyAskCount ?? 0) : 0

    if (count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Upgrade to Pro for unlimited asks.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Increment counter
    await withRetry(() => db.update(users).set({
      dailyAskCount: count + 1,
      lastAskDate: now,
    }).where(eq(users.id, userId)))
  }

  const body = await req.json()
  const question: string = body.question?.trim() ?? ''
  if (!question) {
    return new Response(JSON.stringify({ error: 'Question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Full-text search across notes (with retry for Neon cold starts)
  let matchingNotes = await withRetry(() => db.select({
    id: notes.id,
    title: notes.title,
    polishedTranscript: notes.polishedTranscript,
    summary: notes.summary,
    tags: notes.tags,
    createdAt: notes.createdAt,
  }).from(notes).where(
    and(
      eq(notes.userId, userId),
      sql`to_tsvector('english', coalesce(${notes.title}, '') || ' ' || coalesce(${notes.polishedTranscript}, ''))
          @@ plainto_tsquery('english', ${question})`
    )
  ).orderBy(desc(notes.createdAt)).limit(10))

  // Fallback: most recent notes
  if (matchingNotes.length === 0) {
    matchingNotes = await withRetry(() => db.select({
      id: notes.id,
      title: notes.title,
      polishedTranscript: notes.polishedTranscript,
      summary: notes.summary,
      tags: notes.tags,
      createdAt: notes.createdAt,
    }).from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt))
      .limit(10))
  }

  const noteContext = matchingNotes
    .map(n => {
      const date = format(new Date(n.createdAt), 'MMM d, yyyy')
      const transcript = (n.polishedTranscript ?? '').slice(0, 2000)
      const tags = (n.tags ?? []).join(', ')
      return [
        `Note ID: ${n.id}`,
        `Title: ${n.title}`,
        `Date: ${date}`,
        tags ? `Tags: ${tags}` : null,
        n.summary ? `Summary: ${n.summary}` : null,
        `Transcript:\n${transcript}`,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n---\n\n')

  const systemPrompt = `You are a helpful AI assistant answering questions about a user's voice notes.

Below are the relevant notes with their IDs. When referencing a note in your answer, cite it as a markdown link in this exact format: [Note: "Title" (date)](/notes/{id})

Notes:
${noteContext}

Answer the user's question using information from these notes. Be concise and helpful. If the notes don't contain relevant information, say so honestly.`

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = JSON.stringify({ text: event.delta.text })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        let msg = 'Something went wrong. Please try again.'
        if (err instanceof Anthropic.APIError) {
          if (err.status === 429) msg = 'AI is busy right now. Please try again in a moment.'
          else if (err.status === 401 || err.status === 403) msg = 'AI service configuration error. Please contact support.'
          else if (err.status === 500 || err.status === 529) msg = 'AI service is temporarily unavailable. Please try again shortly.'
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
