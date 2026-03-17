'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ContentPart = string | React.ReactElement

function renderContent(text: string): ContentPart[] {
  // Render note citation links: [Note: "Title" (date)](/notes/id)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: ContentPart[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        className="text-accent-light underline underline-offset-2 hover:text-text-primary transition-colors"
      >
        {match[1]}
      </a>
    )
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts.length > 0 ? parts : [text]
}

export default function AskChat({ noteId }: { noteId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const url = noteId ? `/api/ask/${noteId}` : '/api/ask'

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const question = input.trim()
      if (!question || streaming) return

      setInput('')
      setError(null)
      setMessages(prev => [...prev, { role: 'user', content: question }])

      // Placeholder for the assistant reply we'll stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const controller = new AbortController()
      abortRef.current = controller
      setStreaming(true)

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => null)
          const msg =
            res.status === 429
              ? (json?.error ?? 'Daily limit reached. Upgrade to Pro for unlimited asks.')
              : (json?.error ?? `Request failed (${res.status})`)
          setError(msg)
          // Remove the empty assistant placeholder
          setMessages(prev => prev.slice(0, -1))
          return
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string }
              if (parsed.error) {
                setError(parsed.error)
                break
              }
              if (parsed.text) {
                setMessages(prev => {
                  const next = [...prev]
                  const last = next[next.length - 1]
                  if (last?.role === 'assistant') {
                    next[next.length - 1] = {
                      ...last,
                      content: last.content + parsed.text,
                    }
                  }
                  return next
                })
              }
            } catch {
              // Non-JSON line — ignore
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Something went wrong. Please try again.')
          setMessages(prev => prev.slice(0, -1))
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [input, streaming, url]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Message history */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-accent-violet/20 text-text-primary self-end max-w-[85%] ml-auto'
                  : 'bg-surface text-text-primary self-start max-w-full border border-accent-dim/30'
              )}
            >
              {msg.role === 'assistant' ? (
                <span>
                  {msg.content
                    ? renderContent(msg.content)
                    : streaming && i === messages.length - 1
                      ? (
                          <span className="inline-flex items-center gap-1.5 text-text-muted">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Thinking…
                          </span>
                        )
                      : null}
                </span>
              ) : (
                msg.content
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-error text-sm rounded-lg bg-error/10 border border-error/30 px-4 py-2">
          {error}
        </p>
      )}

      {/* Empty state */}
      {messages.length === 0 && !error && (
        <p className="text-text-muted text-sm text-center py-6">
          {noteId
            ? 'Ask anything about this note.'
            : 'Ask a question across all your notes.'}
        </p>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={noteId ? 'Ask about this note…' : 'Ask across all your notes…'}
          disabled={streaming}
          className={cn(
            'flex-1 bg-surface border border-accent-dim/40 rounded-lg px-4 py-2.5',
            'text-text-primary placeholder:text-text-muted text-sm',
            'focus:outline-none focus:border-accent-violet/70 focus:ring-1 focus:ring-accent-violet/40',
            'disabled:opacity-50 transition-colors'
          )}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className={cn(
            'shrink-0 flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-accent-violet hover:bg-accent-violet/80 text-white',
            'disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent-violet/60'
          )}
          aria-label="Send"
        >
          {streaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}
