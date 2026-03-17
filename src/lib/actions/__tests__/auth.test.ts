import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: { select: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(), values: vi.fn().mockResolvedValue(undefined) },
}))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed'), compare: vi.fn().mockResolvedValue(true) } }))
vi.mock('@/lib/auth/auth', () => ({ signIn: vi.fn(), signOut: vi.fn() }))

const { validateRegisterInput } = await import('../auth')

describe('validateRegisterInput', () => {
  it('fails for short password', () => {
    expect(validateRegisterInput({ name: 'T', email: 'a@b.com', password: 'short' }).success).toBe(false)
  })
  it('fails for invalid email', () => {
    expect(validateRegisterInput({ name: 'T', email: 'notvalid', password: 'longpass123' }).success).toBe(false)
  })
  it('passes for valid input', () => {
    expect(validateRegisterInput({ name: 'Test', email: 'a@b.com', password: 'validpass123' }).success).toBe(true)
  })
})
