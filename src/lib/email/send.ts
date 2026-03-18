import { Resend } from 'resend'

// Lazy-init to avoid crashing at build time when RESEND_API_KEY is not set
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not configured')
    _resend = new Resend(key)
  }
  return _resend
}

export async function sendDigestEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  await getResend().emails.send({
    from: 'Cosmos <onboarding@resend.dev>',
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
