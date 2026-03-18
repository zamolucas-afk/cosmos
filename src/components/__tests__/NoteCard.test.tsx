import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NoteCard from '../NoteCard'

// Mock next/navigation — required for useRouter in NoteCard
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock server actions — they run in Node.js server context, not jsdom
vi.mock('@/lib/actions/notes', () => ({
  toggleFavorite: vi.fn(),
  deleteNote: vi.fn(),
}))

// Mock share utility
vi.mock('@/lib/share', () => ({
  shareNote: vi.fn().mockResolvedValue('copied'),
}))

const note = {
  id: 'test-id',
  userId: 'user-id',
  title: 'My Voice Note',
  rawTranscript: 'Raw transcript text.',
  polishedTranscript: 'This is a test transcript that is longer than 120 characters so we can check the truncation behavior properly.',
  emoji: '🎙️',
  summary: 'A test note summary.',
  actionItems: [],
  keyDecisions: [],
  tags: ['work', 'ideas'],
  duration: 62,
  isFavorite: false,
  viewed: false,
  updatedAt: new Date('2026-03-17T10:00:00Z'),
  createdAt: new Date('2026-03-17T10:00:00Z'),
}

describe('NoteCard', () => {
  it('renders the note title', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText('My Voice Note')).toBeInTheDocument()
  })

  it('renders the duration formatted', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText(/1:02/)).toBeInTheDocument()
  })

  it('truncates long transcripts', () => {
    render(<NoteCard note={note as any} />)
    const text = screen.getByTestId('note-excerpt').textContent
    expect(text!.length).toBeLessThanOrEqual(123)
  })

  it('renders the emoji', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText('🎙️')).toBeInTheDocument()
  })

  it('renders tags as pills', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('ideas')).toBeInTheDocument()
  })

  it('shows unread dot when viewed is false', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByLabelText('Unread')).toBeInTheDocument()
  })

  it('does not show unread dot when viewed is true', () => {
    render(<NoteCard note={{ ...note, viewed: true } as any} />)
    expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument()
  })

  it('shows favorite star when isFavorite is true', () => {
    render(<NoteCard note={{ ...note, isFavorite: true } as any} />)
    expect(screen.getByLabelText('Favorited')).toBeInTheDocument()
  })

  it('renders the three-dot menu button', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByLabelText('Note options')).toBeInTheDocument()
  })
})
