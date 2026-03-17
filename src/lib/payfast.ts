import { createHash } from 'crypto'

export function generateSignature(
  params: Record<string, string>,
  passphrase: string
): string {
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k] !== '' && params[k] !== undefined)
    .map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&')

  const str = passphrase ? `${sorted}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : sorted
  return createHash('md5').update(str).digest('hex')
}

export function getPayFastUrl(): string {
  return process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'
}

export function getPayFastApiUrl(): string {
  return process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://api.sandbox.payfast.co.za'
    : 'https://api.payfast.co.za'
}

export function verifyItnSignature(
  params: Record<string, string>,
  passphrase: string
): boolean {
  const { signature, ...rest } = params
  const expected = generateSignature(rest, passphrase)
  return expected === signature
}

export function buildApiHeaders(endpoint: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const version = 'v1'
  const sig = generateSignature({ endpoint, timestamp, version }, process.env.PAYFAST_PASSPHRASE!)
  return {
    'merchant-id': process.env.PAYFAST_MERCHANT_ID!,
    version,
    timestamp,
    signature: sig,
    'Content-Type': 'application/json',
  }
}
