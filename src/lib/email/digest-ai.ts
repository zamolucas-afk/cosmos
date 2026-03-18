import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type NoteInput = {
  title: string
  summary: string | null
  actionItems: unknown
  keyDecisions: unknown
  tags: string[] | null
}

export async function generateWeeklyDigest(notes: NoteInput[]): Promise<{
  summary: string
  topActionItems: string[]
  themes: string[]
}> {
  const noteContext = notes.map((n, i) => {
    const items = Array.isArray(n.actionItems) ? n.actionItems.map((a: any) => a.text || a).join('; ') : ''
    const decisions = Array.isArray(n.keyDecisions) ? n.keyDecisions.map((d: any) => typeof d === 'string' ? d : d.text || '').join('; ') : ''
    return `Note ${i + 1}: "${n.title}"${n.summary ? `\nSummary: ${n.summary}` : ''}${items ? `\nAction items: ${items}` : ''}${decisions ? `\nKey decisions: ${decisions}` : ''}${n.tags?.length ? `\nTags: ${n.tags.join(', ')}` : ''}`
  }).join('\n\n')

  const truncated = noteContext.slice(0, 20000)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are summarizing a user's voice notes from the past week. They recorded ${notes.length} notes.

Here are the notes:
${truncated}

Respond in JSON only:
{
  "summary": "A 2-3 sentence overview of this week's themes and highlights",
  "topActionItems": ["Up to 5 unresolved or important action items across all notes"],
  "themes": ["3-5 topic themes that emerged this week"]
}`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
    return {
      summary: json.summary || 'Your week in review.',
      topActionItems: Array.isArray(json.topActionItems) ? json.topActionItems : [],
      themes: Array.isArray(json.themes) ? json.themes : [],
    }
  } catch {
    return {
      summary: `You recorded ${notes.length} voice notes this week.`,
      topActionItems: [],
      themes: [],
    }
  }
}
