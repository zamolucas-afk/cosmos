import { describe, it, expect } from 'vitest'
import { generateSignature, getPayFastUrl, verifyItnSignature } from '../payfast'

describe('generateSignature', () => {
  it('returns an MD5 hex string', () => {
    const sig = generateSignature({ amount: '99.00', item_name: 'Test' }, 'passphrase')
    expect(sig).toMatch(/^[a-f0-9]{32}$/)
  })

  it('produces consistent output for same input', () => {
    const params = { b: 'second', a: 'first' }
    const sig1 = generateSignature(params, 'pass')
    const sig2 = generateSignature(params, 'pass')
    expect(sig1).toBe(sig2)
  })

  it('sorts params alphabetically', () => {
    const sig1 = generateSignature({ b: '2', a: '1' }, 'pass')
    const sig2 = generateSignature({ a: '1', b: '2' }, 'pass')
    expect(sig1).toBe(sig2)
  })
})

describe('getPayFastUrl', () => {
  it('returns sandbox URL when sandbox=true', () => {
    process.env.PAYFAST_SANDBOX = 'true'
    expect(getPayFastUrl()).toContain('sandbox')
  })
  it('returns production URL when sandbox=false', () => {
    process.env.PAYFAST_SANDBOX = 'false'
    expect(getPayFastUrl()).not.toContain('sandbox')
  })
})

describe('verifyItnSignature', () => {
  it('returns true when signature matches', () => {
    const params = { amount: '99.00', merchant_id: '123' }
    const passphrase = 'testpass'
    const sig = generateSignature(params, passphrase)
    expect(verifyItnSignature({ ...params, signature: sig }, passphrase)).toBe(true)
  })
  it('returns false when signature is wrong', () => {
    expect(verifyItnSignature({ amount: '99.00', signature: 'badsig' }, 'pass')).toBe(false)
  })
})
