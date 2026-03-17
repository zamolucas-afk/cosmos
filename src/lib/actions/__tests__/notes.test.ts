import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', plan: 'free' } }),
}))
vi.mock('@/lib/claude', () => ({
  polishNote: vi.fn().mockResolvedValue({ title: 'Test Title', polished: 'Clean text.' }),
}))

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{ id: 'note-1' }]),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'note-1' }]),
}
vi.mock('@/lib/db', () => ({ db: mockDb }))

const { getMonthlyRecordingCount } = await import('../notes')

describe('getMonthlyRecordingCount', () => {
  beforeEach(() => {
    mockDb.where.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.select.mockReturnThis()
    // Simulate 3 notes this month
    vi.spyOn(mockDb, 'where').mockReturnValue({ then: (fn: any) => Promise.resolve(fn([{}, {}, {}])) } as any)
  })

  it('returns a number', async () => {
    const count = await getMonthlyRecordingCount('user-1')
    expect(typeof count).toBe('number')
  })
})
