import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NoteCard from '../NoteCard'

const note = {
  id: 'test-id',
  title: 'My Voice Note',
  polishedTranscript: 'This is a test transcript that is longer than 120 characters so we can check the truncation behavior properly.',
  duration: 62,
  createdAt: new Date('2026-03-17T10:00:00Z'),
}

describe('NoteCard', () => {
  it('renders the note title', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText('My Voice Note')).toBeInTheDocument()
  })
  it('renders the duration formatted', () => {
    render(<NoteCard note={note as any} />)
    expect(screen.getByText('1:02')).toBeInTheDocument()
  })
  it('truncates long transcripts', () => {
    render(<NoteCard note={note as any} />)
    const text = screen.getByTestId('note-excerpt').textContent
    expect(text!.length).toBeLessThanOrEqual(123)
  })
})
