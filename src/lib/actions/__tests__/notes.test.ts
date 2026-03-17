import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', plan: 'free' } }),
}))

vi.mock('@/lib/claude', () => ({
  polishNote: vi.fn().mockResolvedValue({
    title: 'Test Title',
    emoji: '📝',
    polished: 'Clean text.',
    summary: 'A brief summary.',
    actionItems: [{ text: 'Follow up', assignee: 'Alice' }],
    keyDecisions: ['Use Next.js'],
    tags: ['tech', 'planning'],
  }),
}))

// mockDb is a thenable chainable mock. Making it thenable (via `then`) means
// `await mockDb.where(...)` works even when `.where()` returns `mockDb`.
// Tests override `limitResult` and `whereResult` to control what resolves.
let limitResult: unknown[] = []
let whereResult: unknown[] = []

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockImplementation(() => Promise.resolve(limitResult)),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'note-1' }]),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  // thenable: allows `await db.select(...).from(...).where(...)` to resolve
  then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(whereResult)),
}
vi.mock('@/lib/db', () => ({ db: mockDb }))

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const {
  getMonthlyNoteCount,
  getTrialNoteCount,
  saveNote,
  toggleFavorite,
  markViewed,
} = await import('../notes')

function resetMocks() {
  limitResult = []
  whereResult = []
  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockImplementation(() => Promise.resolve(limitResult))
  mockDb.insert.mockReturnThis()
  mockDb.values.mockReturnThis()
  mockDb.returning.mockResolvedValue([{ id: 'note-1' }])
  mockDb.delete.mockReturnThis()
  mockDb.update.mockReturnThis()
  mockDb.set.mockReturnThis()
  mockDb.then.mockImplementation((resolve: (v: unknown) => void) => resolve(whereResult))
}

// ─── getMonthlyNoteCount ────────────────────────────────────────────────────
// Query: db.select().from(notes).where(...)   ← terminates with .where() (thenable)

describe('getMonthlyNoteCount', () => {
  beforeEach(resetMocks)

  it('returns the count value from the DB result', async () => {
    whereResult = [{ count: 3 }]
    const result = await getMonthlyNoteCount('user-1')
    expect(result).toBe(3)
  })

  it('returns 0 when no rows returned', async () => {
    whereResult = []
    const result = await getMonthlyNoteCount('user-1')
    expect(result).toBe(0)
  })
})

// ─── getTrialNoteCount ──────────────────────────────────────────────────────

describe('getTrialNoteCount', () => {
  beforeEach(resetMocks)

  it('returns the count value from the DB result', async () => {
    whereResult = [{ count: 5 }]
    const result = await getTrialNoteCount('user-1', new Date('2026-01-01'))
    expect(result).toBe(5)
  })

  it('returns 0 when no rows returned', async () => {
    whereResult = []
    const result = await getTrialNoteCount('user-1', new Date('2026-01-01'))
    expect(result).toBe(0)
  })
})

// ─── saveNote ───────────────────────────────────────────────────────────────
// Query order:
//   1. db.select({ plan, trialStartedAt }).from(users).where(...).limit(1)  → limitResult (user)
//   2. db.select({ count }).from(notes).where(...)                          → whereResult (count)
//   3. db.insert(notes).values(...).returning(...)                          → returning mock

describe('saveNote', () => {
  beforeEach(resetMocks)

  it('saves note for free user under limit and returns id', async () => {
    limitResult = [{ plan: 'free', trialStartedAt: null }]
    whereResult = [{ count: 2 }]

    const result = await saveNote('Hello world', 30)
    expect(result).toEqual({ id: 'note-1' })
  })

  it('throws when free user hits 3 note/month limit', async () => {
    limitResult = [{ plan: 'free', trialStartedAt: null }]
    whereResult = [{ count: 3 }]

    await expect(saveNote('Hello world', 30)).rejects.toThrow('Monthly note limit reached')
  })

  it('throws when trial user hits 20 note limit', async () => {
    limitResult = [{ plan: 'trial', trialStartedAt: new Date('2026-01-01') }]
    whereResult = [{ count: 20 }]

    await expect(saveNote('Hello world', 30)).rejects.toThrow('Trial note limit reached')
  })

  it('saves note for trial user under 20-note limit', async () => {
    limitResult = [{ plan: 'trial', trialStartedAt: new Date('2026-01-01') }]
    whereResult = [{ count: 5 }]
    mockDb.returning.mockResolvedValueOnce([{ id: 'note-2' }])

    const result = await saveNote('Trial note', 15)
    expect(result).toEqual({ id: 'note-2' })
  })

  it('saves note for pro user with no limit check', async () => {
    limitResult = [{ plan: 'pro', trialStartedAt: null }]
    mockDb.returning.mockResolvedValueOnce([{ id: 'note-3' }])

    const result = await saveNote('Pro note', 60)
    expect(result).toEqual({ id: 'note-3' })
  })

  it('throws when unauthenticated', async () => {
    const { auth } = await import('@/lib/auth/auth')
    vi.mocked(auth).mockResolvedValueOnce(null as any)
    await expect(saveNote('Hello', 10)).rejects.toThrow('Unauthenticated')
  })

  it('throws when user not found in DB', async () => {
    limitResult = []
    await expect(saveNote('Hello', 10)).rejects.toThrow('User not found')
  })
})

// ─── toggleFavorite ─────────────────────────────────────────────────────────
// Query order:
//   1. db.select({ isFavorite }).from(notes).where(...).limit(1)  → limitResult (note)
//   2. db.update(notes).set(...).where(...)                       → thenable (whereResult)

describe('toggleFavorite', () => {
  beforeEach(resetMocks)

  it('toggles favorite from false to true without error', async () => {
    limitResult = [{ isFavorite: false }]
    await expect(toggleFavorite('note-1')).resolves.toBeUndefined()
  })

  it('toggles favorite from true to false without error', async () => {
    limitResult = [{ isFavorite: true }]
    await expect(toggleFavorite('note-1')).resolves.toBeUndefined()
  })

  it('throws when note not found', async () => {
    limitResult = []
    await expect(toggleFavorite('nonexistent')).rejects.toThrow('Note not found')
  })

  it('throws when unauthenticated', async () => {
    const { auth } = await import('@/lib/auth/auth')
    vi.mocked(auth).mockResolvedValueOnce(null as any)
    await expect(toggleFavorite('note-1')).rejects.toThrow('Unauthenticated')
  })
})

// ─── markViewed ─────────────────────────────────────────────────────────────
// Query: db.update(notes).set(...).where(...)  — terminal is thenable .where()

describe('markViewed', () => {
  beforeEach(resetMocks)

  it('resolves without error for valid note', async () => {
    await expect(markViewed('note-1')).resolves.toBeUndefined()
  })

  it('throws when unauthenticated', async () => {
    const { auth } = await import('@/lib/auth/auth')
    vi.mocked(auth).mockResolvedValueOnce(null as any)
    await expect(markViewed('note-1')).rejects.toThrow('Unauthenticated')
  })
})
