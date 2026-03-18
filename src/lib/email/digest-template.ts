export function buildDigestHtml(params: {
  userName: string
  weekLabel: string
  summary: string
  noteCount: number
  topActionItems: string[]
  themes: string[]
  appUrl: string
}): string {
  const actionItemsHtml = params.topActionItems.length > 0
    ? `<div style="margin: 20px 0;">
        <h3 style="color: #a855f7; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Action Items</h3>
        ${params.topActionItems.map(item => `<div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
          <span style="color: #7c3aed;">&#8226;</span>
          <span style="color: #f0f0ff; font-size: 14px; line-height: 1.5;">${item}</span>
        </div>`).join('')}
      </div>`
    : ''

  const themesHtml = params.themes.length > 0
    ? `<div style="margin: 16px 0;">
        ${params.themes.map(t => `<span style="display: inline-block; background: #4c1d95; color: #c084fc; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 0 4px 4px 0;">${t}</span>`).join('')}
      </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin: 0; padding: 0; background: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 50%, #4c1d95); margin: 0 auto 16px;"></div>
      <h1 style="color: #f0f0ff; font-size: 22px; margin: 0;">Your Week in Review</h1>
      <p style="color: #9090b0; font-size: 13px; margin: 4px 0 0;">${params.weekLabel} \u00b7 ${params.noteCount} note${params.noteCount !== 1 ? 's' : ''}</p>
    </div>

    <div style="background: #0d0d1a; border-radius: 16px; padding: 24px; border: 1px solid #4c1d9533;">
      <p style="color: #f0f0ff; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">${params.summary}</p>
      ${actionItemsHtml}
      ${themesHtml}
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${params.appUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Open Cosmos</a>
    </div>

    <p style="text-align: center; color: #50507a; font-size: 11px; margin-top: 40px;">
      You're receiving this because you have weekly digests enabled.<br>
      <a href="${params.appUrl}/settings" style="color: #7c3aed; text-decoration: none;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`
}
