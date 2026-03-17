'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Note } from '@/lib/db/schema'

export default function SearchBar({
  notes,
  onFilter,
}: {
  notes: Note[]
  onFilter: (filtered: Note[]) => void
}) {
  const [query, setQuery] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.toLowerCase()
    setQuery(e.target.value)
    onFilter(
      q
        ? notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.polishedTranscript.toLowerCase().includes(q)
          )
        : notes
    )
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search notes..."
        className="w-full bg-surface border border-accent-dim/30 rounded-lg pl-9 pr-4 py-2.5
          text-text-primary text-sm placeholder:text-text-muted
          focus:outline-none focus:border-accent-violet transition-colors"
      />
    </div>
  )
}
