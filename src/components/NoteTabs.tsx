'use client'

import { cn } from '@/lib/utils'

const TABS = ['All', 'Meetings', 'Favorites', 'Collections'] as const
export type NoteTab = typeof TABS[number]

export default function NoteTabs({ active, onChange }: { active: NoteTab; onChange: (tab: NoteTab) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-heading whitespace-nowrap transition-colors cursor-pointer',
            active === tab
              ? 'bg-accent-violet text-white shadow-[0_0_16px_#7c3aed66]'
              : 'bg-surface-raised text-text-secondary border border-accent-dim/30 hover:text-text-primary'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
