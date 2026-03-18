'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import NoteCard from './NoteCard'
import CollectionCard from './CollectionCard'
import SearchBar from './SearchBar'
import NoteTabs, { type NoteTab } from './NoteTabs'
// NOTE: Do NOT import Navbar here — it is an async Server Component and cannot be imported in a 'use client' module
import type { Note } from '@/lib/db/schema'

const MEETING_KEYWORDS = ['meeting', 'meetings', 'standup', 'sync', '1-on-1', 'one-on-one', 'catch-up', 'review', 'retro', 'retrospective', 'kickoff', 'check-in']

function filterByTab(notes: Note[], tab: NoteTab): Note[] {
  switch (tab) {
    case 'All':
      return notes
    case 'Meetings':
      return notes.filter(n => (n.tags ?? []).some(t => MEETING_KEYWORDS.includes(t.toLowerCase())))
    case 'Favorites':
      return notes.filter(n => n.isFavorite === true)
    case 'Collections':
      return notes // placeholder — collections view handled separately
  }
}

type Collection = { tag: string; noteCount: number }

export default function NotesFeed({ notes, collections = [] }: { notes: Note[]; collections?: Collection[] }) {
  const [activeTab, setActiveTab] = useState<NoteTab>('All')
  const [searchFiltered, setSearchFiltered] = useState(notes)

  const tabFiltered = filterByTab(searchFiltered, activeTab)

  return (
    <>
      <main className="max-w-2xl mx-auto pb-8">
        <NoteTabs active={activeTab} onChange={setActiveTab} />

        <div className="px-4 mb-6">
          <SearchBar notes={notes} onFilter={setSearchFiltered} />
        </div>

        {activeTab === 'Collections' ? (
          collections.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 px-4">
              {collections.map(c => (
                <CollectionCard key={c.tag} tag={c.tag} noteCount={c.noteCount} summary={null} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-full bg-accent-dim/30 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-accent-violet/60 violet-glow"
                  style={{ boxShadow: '0 0 20px #7c3aed66' }} />
              </div>
              <p className="text-text-secondary text-sm">Tags appear automatically as you take notes.</p>
            </div>
          )
        ) : tabFiltered.length === 0 ? (
          <div className="text-center py-20 px-4 flex flex-col items-center">
            <Link
              href="/record"
              className="relative mb-6 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 50%, #4c1d95 80%, #2e1065)',
                boxShadow: '0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.3)',
                animation: 'landing-orb-pulse 3s ease-in-out infinite',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity={0.9}>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </Link>
            <p className="text-text-secondary text-sm">
              {notes.length === 0
                ? 'Nothing recorded yet. Tap the orb to begin.'
                : activeTab === 'Favorites'
                ? 'No favourites yet. Star a note to see it here.'
                : activeTab === 'Meetings'
                ? 'No meeting notes found.'
                : 'No notes match your search.'}
            </p>
            <style>{`
              @keyframes landing-orb-pulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.3);
                }
                50% {
                  transform: scale(1.08);
                  box-shadow: 0 0 60px #a855f7aa, 0 0 120px #7c3aed66, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.4);
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            {tabFiltered.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </main>

      <Link
        href="/record"
        className="violet-glow-strong fixed bottom-6 left-4 right-4 max-w-2xl mx-auto py-3.5 rounded-2xl
          bg-gradient-to-r from-accent-violet to-accent-light text-white font-heading font-semibold
          text-center shadow-[0_0_30px_#7c3aed66,0_4px_20px_rgba(0,0,0,0.4)]
          flex items-center justify-center gap-2 z-10"
      >
        <Mic className="w-5 h-5" />
        New Note
      </Link>
    </>
  )
}
