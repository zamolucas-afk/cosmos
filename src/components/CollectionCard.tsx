'use client'

import Link from 'next/link'

export default function CollectionCard({ tag, noteCount, summary }: {
  tag: string
  noteCount: number
  summary: string | null
}) {
  return (
    <Link href={`/collections/${encodeURIComponent(tag)}`}
      className="block bg-surface rounded-lg border border-accent-dim/20 p-4
        hover:bg-surface-raised transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading text-text-primary capitalize">{tag}</h3>
        <span className="text-text-muted text-xs">{noteCount} notes</span>
      </div>
      {summary && (
        <p className="text-text-secondary text-sm line-clamp-2">{summary}</p>
      )}
    </Link>
  )
}
