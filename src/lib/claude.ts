import Anthropic from '@anthropic-ai/sdk'
import { InsightsSchema } from '@/lib/validation/insights'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

const SYSTEM_PROMPT = `You are an AI assistant that processes voice note transcripts.
Given a raw transcript, return a JSON object with these fields:
- title: concise, descriptive title (3-6 words, no quotes or punctuation at the end)
- emoji: single emoji that best represents the topic
- polished: cleaned-up transcript with proper grammar, punctuation, and paragraph breaks
- summary: 2-3 sentence overview of the key points
- actionItems: array of { text, assignee? } for any action items mentioned (empty array if none)
- keyDecisions: array of strings for decisions made (empty array if none)
- tags: array of 2-5 lowercase topic tags (e.g., "pricing", "hiring", "s4hana")

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`

type PolishResult = {
  title: string
  emoji: string
  polished: string
  summary: string
  actionItems: { text: string; assignee?: string }[]
  keyDecisions: string[]
  tags: string[]
}

const FALLBACK: Omit<PolishResult, 'polished'> = {
  title: 'Voice Note',
  emoji: '📝',
  summary: '',
  actionItems: [],
  keyDecisions: [],
  tags: [],
}

export async function polishNote(rawTranscript: string): Promise<PolishResult> {
  const truncated = rawTranscript.slice(0, 25000)

  // Retry up to 2 times for transient Anthropic API errors (500, 529, etc.)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: truncated }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : null
      if (!text) return { ...FALLBACK, polished: rawTranscript }

      const parsed = JSON.parse(text)
      const validated = InsightsSchema.safeParse(parsed)

      if (validated.success) {
        return validated.data
      }

      // Partial fallback: extract what we can
      return {
        title: typeof parsed.title === 'string' ? parsed.title : FALLBACK.title,
        emoji: typeof parsed.emoji === 'string' ? parsed.emoji : FALLBACK.emoji,
        polished: typeof parsed.polished === 'string' ? parsed.polished : rawTranscript,
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      }
    } catch (err) {
      const isRetryable =
        err instanceof Anthropic.APIError && (err.status === 500 || err.status === 529 || err.status === 502 || err.status === 503)
      console.error(`[polishNote] Attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err)
      if (!isRetryable || attempt === 2) {
        return { ...FALLBACK, polished: rawTranscript }
      }
      // Brief delay before retry
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  return { ...FALLBACK, polished: rawTranscript }
}
