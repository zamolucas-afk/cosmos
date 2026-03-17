import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { checkAndExpireTrial } from '@/lib/trial'
import { format } from 'date-fns'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const { noteId } = await params
  const plan = await checkAndExpireTrial(userId)

  // Rate limit: free users get 5 asks/day
  if (plan === 'free') {
    const [user] = await db
      .select({ dailyAskCount: users.dailyAskCount, lastAskDate: users.lastAskDate })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const now = new Date()
    const sameDay = user?.lastAskDate ? isSameDay(new Date(user.lastAskDate), now) : false
    const count = sameDay ? (user?.dailyAskCount ?? 0) : 0

    if (count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Upgrade to Pro for unlimited asks.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await db.update(users).set({
      dailyAskCount: count + 1,
      lastAskDate: now,
    }).where(eq(users.id, userId))
  }

  const body = await req.json()
  const question: string = body.question?.trim() ?? ''
  if (!question) {
    return new Response(JSON.stringify({ error: 'Question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Load the specific note, verify ownership
  const [note] = await db.select({
    id: notes.id,
    title: notes.title,
    polishedTranscript: notes.polishedTranscript,
    summary: notes.summary,
    tags: notes.tags,
    createdAt: notes.createdAt,
  }).from(notes).where(
    and(eq(notes.id, noteId), eq(notes.userId, userId))
  ).limit(1)

  if (!note) {
    return new Response(JSON.stringify({ error: 'Note not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const date = format(new Date(note.createdAt), 'MMM d, yyyy')
  const tags = (note.tags ?? []).join(', ')
  const noteContext = [
    `Title: ${note.title}`,
    `Date: ${date}`,
    tags ? `Tags: ${tags}` : null,
    note.summary ? `Summary: ${note.summary}` : null,
    `Full Transcript:\n${note.polishedTranscript}`,
  ]
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `You are a helpful AI assistant answering questions about a specific voice note.

Note:
${noteContext}

Answer the user's question using information from this note. Be concise and helpful. If the note doesn't contain relevant information, say so honestly.`

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
        const msg = err instanceof Error ? err.message : 'Stream error'
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
