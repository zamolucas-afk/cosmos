'use client'

import TagPill from './TagPill'

type ActionItem = { text: string; assignee?: string }

export default function InsightsView({
  summary,
  actionItems,
  keyDecisions,
  tags,
}: {
  summary: string | null
  actionItems: ActionItem[] | null
  keyDecisions: string[] | null
  tags: string[] | null
}) {
  const items = (actionItems ?? []) as ActionItem[]
  const decisions = (keyDecisions ?? []) as string[]
  const tagList = (tags ?? []) as string[]

  if (!summary && items.length === 0 && decisions.length === 0) {
    return (
      <p className="text-text-muted text-sm italic">No insights available for this note.</p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <div>
          <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Summary</h3>
          <p className="text-text-primary text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Action Items</h3>
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-accent-light mt-0.5">•</span>
                <span className="text-text-primary">
                  {item.text}
                  {item.assignee && (
                    <span className="text-accent-light ml-1">@{item.assignee}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {decisions.length > 0 && (
        <div>
          <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Key Decisions</h3>
          <ul className="flex flex-col gap-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-success mt-0.5">✓</span>
                <span className="text-text-primary">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tagList.length > 0 && (
        <div>
          <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tagList.map(tag => <TagPill key={tag} tag={tag} />)}
          </div>
        </div>
      )}
    </div>
  )
}
