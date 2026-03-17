'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import NoteCard from './NoteCard'
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

export default function NotesFeed({ notes }: { notes: Note[] }) {
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
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-accent-dim/30 mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent-violet/60"
                style={{ boxShadow: '0 0 20px #7c3aed66' }} />
            </div>
            <p className="text-text-secondary text-sm">Collections coming soon</p>
          </div>
        ) : tabFiltered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-accent-dim/30 mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent-violet/60"
                style={{ boxShadow: '0 0 20px #7c3aed66' }} />
            </div>
            <p className="text-text-secondary text-sm">
              {notes.length === 0
                ? 'No notes yet. Tap to create one.'
                : activeTab === 'Favorites'
                ? 'No favourites yet. Star a note to see it here.'
                : activeTab === 'Meetings'
                ? 'No meeting notes found.'
                : 'No notes match your search.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            {tabFiltered.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </main>

      <Link
        href="/record"
        className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto py-3.5 rounded-2xl
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
