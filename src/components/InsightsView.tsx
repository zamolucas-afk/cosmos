'use client'

import { useState, useTransition } from 'react'
import { RefreshCw, CheckCircle2, Lightbulb, Tag, AlertCircle } from 'lucide-react'
import { repolishNote } from '@/lib/actions/notes'
import { cn } from '@/lib/utils'
import TagPill from './TagPill'

type ActionItem = { text: string; assignee?: string }

export default function InsightsView({
  noteId,
  summary,
  actionItems,
  keyDecisions,
  tags,
}: {
  noteId: string
  summary: string | null
  actionItems: ActionItem[] | null
  keyDecisions: string[] | null
  tags: string[] | null
}) {
  const items = (actionItems ?? []) as ActionItem[]
  // keyDecisions may come as string[] or {text: string}[] from DB — normalize to strings
  const decisions = (keyDecisions ?? []).map((d: unknown) =>
    typeof d === 'string' ? d : (d as { text?: string })?.text ?? String(d)
  )
  const tagList = (tags ?? []) as string[]
  const hasInsights = summary || items.length > 0 || decisions.length > 0

  const [repolishing, startRepolish] = useTransition()
  const [repolishError, setRepolishError] = useState<string | null>(null)

  function handleRepolish() {
    setRepolishError(null)
    startRepolish(async () => {
      const result = await repolishNote(noteId)
      if (result.success) {
        window.location.reload()
      } else {
        setRepolishError(result.error ?? 'Failed to regenerate insights.')
      }
    })
  }

  if (!hasInsights) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-accent-dim/20 flex items-center justify-center">
          <Lightbulb className="w-7 h-7 text-accent-light" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-1">No insights available yet</p>
          <p className="text-text-muted text-xs">AI processing may have failed. Tap below to retry.</p>
        </div>
        <button
          onClick={handleRepolish}
          disabled={repolishing}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-medium transition-all',
            'bg-accent-violet/20 text-accent-light border border-accent-violet/40',
            'hover:bg-accent-violet/30 hover:border-accent-violet/60',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', repolishing && 'animate-spin')} />
          {repolishing ? 'Generating insights…' : 'Generate AI Insights'}
        </button>
        {repolishError && (
          <p className="text-error text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {repolishError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Overview / Summary */}
      {summary && (
        <section className="bg-surface rounded-xl p-4 border border-accent-dim/20">
          <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-accent-violet" />
            Overview
          </h3>
          <p className="text-text-primary text-sm leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Action Items */}
      {items.length > 0 && (
        <section className="bg-surface rounded-xl p-4 border border-accent-dim/20">
          <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-light" />
            Action Items
            <span className="ml-auto text-text-muted text-[10px] font-body">{items.length}</span>
          </h3>
          <ul className="flex flex-col gap-2.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm group">
                <span className="shrink-0 w-5 h-5 rounded-md border border-accent-dim/40 flex items-center justify-center mt-0.5 group-hover:border-accent-violet/60 transition-colors">
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
      {decisions.length > 0 && (
        <section className="bg-surface rounded-xl p-4 border border-accent-dim/20">
          <h3 className="text-text-secondary text-xs uppercase tracking-wider font-heading mb-2.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-success" />
            Key Decisions
            <span className="ml-auto text-text-muted text-[10px] font-body">{decisions.length}</span>
          </h3>
          <ul className="flex flex-col gap-2.5">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-success text-xs">✓</span>
                </span>
                <span className="text-text-primary leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      {tagList.length > 0 && (
        <section className="flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-text-muted" />
          {tagList.map(tag => <TagPill key={tag} tag={tag} />)}
        </section>
      )}

      {/* Re-polish button */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleRepolish}
          disabled={repolishing}
          className="flex items-center gap-1.5 text-text-muted hover:text-accent-light text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3', repolishing && 'animate-spin')} />
          {repolishing ? 'Regenerating…' : 'Regenerate insights'}
        </button>
        {repolishError && (
          <span className="text-error text-xs">{repolishError}</span>
        )}
      </div>
    </div>
  )
}
