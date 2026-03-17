import { describe, it, expect } from 'vitest'
import { users, notes, subscriptions, payments, accounts, verificationTokens } from '../schema'

describe('schema exports', () => {
  it('exports users table', () => { expect(users).toBeDefined() })
  it('exports notes table', () => { expect(notes).toBeDefined() })
  it('exports subscriptions table', () => { expect(subscriptions).toBeDefined() })
  it('exports payments table', () => { expect(payments).toBeDefined() })
  it('exports accounts table', () => { expect(accounts).toBeDefined() })
  it('exports verificationTokens table', () => { expect(verificationTokens).toBeDefined() })
})
