import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are processing a voice note transcript. Do two things and return valid JSON only:

1. "title": A short descriptive title for this note (max 6 words, no punctuation, no quotes).
2. "polished": The cleaned transcript — fix punctuation, remove filler words (um, uh, like, you know, sort of), correct grammar, format into clean paragraphs. Keep all meaning intact. Do not summarise. Do not add anything. Just clean up what was said.

Return exactly: {"title": "...", "polished": "..."}`

export async function polishNote(rawTranscript: string): Promise<{ title: string; polished: string }> {
  const truncated = rawTranscript.slice(0, 25000)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Raw transcript:\n"""\n${truncated}\n"""` }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text)
    if (typeof parsed.title === 'string' && typeof parsed.polished === 'string') {
      return { title: parsed.title, polished: parsed.polished }
    }
    throw new Error('Invalid shape')
  } catch {
    return { title: 'Voice Note', polished: rawTranscript }
  }
}
