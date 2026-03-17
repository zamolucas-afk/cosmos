'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NoteCard from './NoteCard'
import SearchBar from './SearchBar'
// NOTE: Do NOT import Navbar here — it is an async Server Component and cannot be imported in a 'use client' module
import type { Note } from '@/lib/db/schema'

export default function NotesFeed({ notes }: { notes: Note[] }) {
  const [filtered, setFiltered] = useState(notes)
  const router = useRouter()

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <SearchBar notes={notes} onFilter={setFiltered} />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-accent-dim/30 mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent-violet/60"
                style={{ boxShadow: '0 0 20px #7c3aed66' }} />
            </div>
            <p className="text-text-secondary text-sm">
              {notes.length === 0 ? 'No notes yet. Tap to create one.' : 'No notes match your search.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </main>

      <button
        onClick={() => router.push('/record')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent-violet cursor-pointer
          flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ boxShadow: '0 0 30px #7c3aed88, 0 0 60px #7c3aed44', animation: 'orb-pulse 3s ease-in-out infinite' }}
        aria-label="New Note"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>

      <style>{`
        @keyframes orb-pulse {
          0%,100% { box-shadow: 0 0 30px #7c3aed88, 0 0 60px #7c3aed44; }
          50% { box-shadow: 0 0 45px #a855f7bb, 0 0 90px #7c3aed66; }
        }
      `}</style>
    </>
  )
}
