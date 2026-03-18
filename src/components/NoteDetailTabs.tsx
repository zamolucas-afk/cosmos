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
  duration: number
}

/** Split transcript into ~30-second chunks with estimated timestamps */
function addTimestamps(text: string, durationSecs: number): { time: string; text: string }[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [text]
  const totalChars = text.length
  if (totalChars === 0 || durationSecs === 0) return [{ time: '0:00', text }]

  const CHUNK_INTERVAL = 30
  const chunks: { time: string; text: string }[] = []
  let currentChunk = ''
  let charsSoFar = 0

  for (const sentence of sentences) {
    const sentenceMidpoint = charsSoFar + sentence.length / 2
    const estimatedTime = (sentenceMidpoint / totalChars) * durationSecs
    const chunkIndex = Math.floor(estimatedTime / CHUNK_INTERVAL)

    if (chunks.length <= chunkIndex && currentChunk) {
      chunks.push({ time: fmtTime(chunks.length * CHUNK_INTERVAL), text: currentChunk.trim() })
      currentChunk = ''
    }

    currentChunk += sentence
    charsSoFar += sentence.length
  }

  if (currentChunk.trim()) {
    chunks.push({ time: fmtTime(chunks.length * CHUNK_INTERVAL), text: currentChunk.trim() })
  }

  return chunks.length > 0 ? chunks : [{ time: '0:00', text }]
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const TABS = ['Summary', 'Transcript', 'Ask'] as const
type Tab = typeof TABS[number]

export default function NoteDetailTabs({ note }: { note: NoteData }) {
  const [activeTab, setActiveTab] = useState<Tab>('Summary')
  const [showTimestamps, setShowTimestamps] = useState(true)

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
          noteId={note.id}
          summary={note.summary}
          actionItems={note.actionItems as { text: string; assignee?: string }[] | null}
          keyDecisions={note.keyDecisions as string[] | null}
          tags={note.tags}
        />
      )}

      {activeTab === 'Transcript' && (
        <div>
          {/* Transcript Settings */}
          <div className="flex items-center justify-end mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-text-muted">Timestamps</span>
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={cn(
                  'w-9 h-5 rounded-full transition-colors relative',
                  showTimestamps ? 'bg-accent-violet' : 'bg-surface-raised'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                  showTimestamps ? 'translate-x-4' : 'translate-x-0.5'
                )} />
              </button>
            </label>
          </div>

          {showTimestamps && note.duration > 0 ? (
            <div className="space-y-4">
              {addTimestamps(note.polishedTranscript, note.duration).map((chunk, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-accent-light text-xs font-mono mt-0.5 shrink-0 w-10 text-right">
                    {chunk.time}
                  </span>
                  <p className="text-text-primary text-sm leading-relaxed">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {note.polishedTranscript}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Ask' && (
        <AskChat noteId={note.id} />
      )}
    </div>
  )
}
