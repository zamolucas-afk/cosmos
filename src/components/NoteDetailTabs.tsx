'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import InsightsView from './InsightsView'
import AskChat from './AskChat'

type NoteData = {
  id: string
  polishedTranscript: string
  summary: string | null
  actionItems: unknown
  keyDecisions: unknown
  tags: string[] | null
}

const TABS = ['Summary', 'Transcript', 'Ask'] as const
type Tab = typeof TABS[number]

export default function NoteDetailTabs({ note }: { note: NoteData }) {
  const [activeTab, setActiveTab] = useState<Tab>('Summary')

  return (
    <div>
      <div className="flex gap-1 bg-surface rounded-lg p-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-heading transition-colors cursor-pointer',
              activeTab === tab
                ? 'bg-accent-violet text-white'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Summary' && (
        <InsightsView
          summary={note.summary}
          actionItems={note.actionItems as { text: string; assignee?: string }[] | null}
          keyDecisions={note.keyDecisions as string[] | null}
          tags={note.tags}
        />
      )}

      {activeTab === 'Transcript' && (
        <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
          {note.polishedTranscript}
        </div>
      )}

      {activeTab === 'Ask' && (
        <AskChat noteId={note.id} />
      )}
    </div>
  )
}
