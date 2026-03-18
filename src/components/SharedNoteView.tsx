'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { CheckCircle2, Lightbulb, Tag } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Note } from '@/lib/db/schema'

type ActionItem = { text: string; assignee?: string }

export default function SharedNoteView({ note }: { note: Note }) {
  const actionItems = (note.actionItems ?? []) as ActionItem[]
  const rawDecisions = (note.keyDecisions ?? []) as unknown[]
  const keyDecisions = rawDecisions.map((d: unknown) =>
    typeof d === 'string' ? d : (d as { text?: string })?.text ?? String(d)
  )
  const tags = (note.tags ?? []) as string[]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {note.emoji && (
            <span className="text-3xl leading-none mt-1 shrink-0">{note.emoji}</span>
          )}
          <h1 className="text-3xl font-heading text-text-primary leading-tight">
            {note.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-text-muted text-sm mb-8">
          <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
          <span className="border border-accent-dim/40 rounded-full px-2 py-0.5 text-xs">
            {formatDuration(note.duration)}
          </span>
        </div>

        {/* Summary */}
        {note.summary && (
          <section className="bg-surface rounded-xl p-4 border border-accent-dim/20 mb-5">
            <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-accent-violet" />
              Overview
            </h3>
            <p className="text-text-primary text-sm leading-relaxed">{note.summary}</p>
          </section>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <section className="bg-surface rounded-xl p-4 border border-accent-dim/20 mb-5">
            <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-light" />
              Action Items
              <span className="ml-auto text-text-muted text-[10px] font-body">{actionItems.length}</span>
            </h3>
            <ul className="flex flex-col gap-2.5">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-md border border-accent-dim/40 flex items-center justify-center mt-0.5">
                    <span className="w-2 h-2 rounded-sm bg-accent-violet/40" />
                  </span>
                  <span className="text-text-primary leading-relaxed">
                    {item.text}
                    {item.assignee && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-accent-light text-xs bg-accent-violet/10 px-1.5 py-0.5 rounded-md">
                        @{item.assignee}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Key Decisions */}
        {keyDecisions.length > 0 && (
          <section className="bg-surface rounded-xl p-4 border border-accent-dim/20 mb-5">
            <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-success" />
              Key Decisions
              <span className="ml-auto text-text-muted text-[10px] font-body">{keyDecisions.length}</span>
            </h3>
            <ul className="flex flex-col gap-2.5">
              {keyDecisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <span className="text-success text-xs">&#10003;</span>
                  </span>
                  <span className="text-text-primary leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <section className="flex items-center gap-2 flex-wrap mb-8">
            <Tag className="w-3.5 h-3.5 text-text-muted" />
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-accent-violet/10 text-accent-light border border-accent-violet/20"
              >
                {tag}
              </span>
            ))}
          </section>
        )}

        {/* Polished Transcript */}
        <section className="mb-8">
          <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-3">
            Transcript
          </h3>
          <div className="bg-surface rounded-xl p-4 border border-accent-dim/20">
            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {note.polishedTranscript}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-accent-dim/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            Powered by Cosmos
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-medium
              bg-accent-violet text-white hover:bg-accent-violet/90 transition-colors"
            style={{ boxShadow: '0 0 20px #7c3aed66' }}
          >
            Try Cosmos &rarr;
          </Link>
        </footer>
      </div>
    </div>
  )
}
