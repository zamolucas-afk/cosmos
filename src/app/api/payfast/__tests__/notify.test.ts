import { describe, it, expect } from 'vitest'
import { generateSignature, verifyItnSignature } from '@/lib/payfast'

describe('ITN signature verification', () => {
  it('accepts valid signature', () => {
    const params = { merchant_id: '123', amount: '99.00', payment_status: 'COMPLETE' }
    const pass = 'testpass'
    const sig = generateSignature(params, pass)
    expect(verifyItnSignature({ ...params, signature: sig }, pass)).toBe(true)
  })

  it('rejects tampered amount', () => {
    const params = { amount: '99.00' }
    const sig = generateSignature(params, 'pass')
    expect(verifyItnSignature({ amount: '1.00', signature: sig }, 'pass')).toBe(false)
  })
})
