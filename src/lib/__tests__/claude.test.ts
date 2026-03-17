import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: mockCreate } },
}))

const { polishNote } = await import('../claude')

const FULL_INSIGHTS = {
  title: 'Meeting Notes',
  emoji: '📋',
  polished: 'The meeting went well and we covered all agenda items.',
  summary: 'Team discussed project status. Key milestones were reviewed. Next steps were agreed upon.',
  actionItems: [{ text: 'Send follow-up email', assignee: 'Alice' }],
  keyDecisions: ['Move to weekly cadence'],
  tags: ['meeting', 'planning'],
}

describe('polishNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns full insights from Claude response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(FULL_INSIGHTS) }],
    })
    const result = await polishNote('um so yeah like the meeting was good')
    expect(result.title).toBe('Meeting Notes')
    expect(result.emoji).toBe('📋')
    expect(result.polished).toBe('The meeting went well and we covered all agenda items.')
    expect(result.summary).toContain('Team discussed project status')
    expect(result.actionItems).toEqual([{ text: 'Send follow-up email', assignee: 'Alice' }])
    expect(result.keyDecisions).toEqual(['Move to weekly cadence'])
    expect(result.tags).toEqual(['meeting', 'planning'])
  })

  it('falls back gracefully on malformed JSON', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'not json' }] })
    const result = await polishNote('raw text here')
    expect(result.title).toBe('Voice Note')
    expect(result.emoji).toBe('📝')
    expect(result.polished).toBe('raw text here')
    expect(result.actionItems).toEqual([])
    expect(result.keyDecisions).toEqual([])
    expect(result.tags).toEqual([])
  })

  it('truncates input to 25000 chars', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(FULL_INSIGHTS) }],
    })
    const long = 'a'.repeat(30000)
    await polishNote(long)
    const calledText = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(calledText.length).toBeLessThan(26000)
  })
})
