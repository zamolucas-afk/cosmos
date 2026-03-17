import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: mockCreate } },
}))

const { polishNote } = await import('../claude')

describe('polishNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns title and polished from Claude response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"title":"Meeting Notes","polished":"Clean text."}' }],
    })
    const result = await polishNote('um so yeah like the meeting was good')
    expect(result.title).toBe('Meeting Notes')
    expect(result.polished).toBe('Clean text.')
  })

  it('falls back gracefully on malformed JSON', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'not json' }] })
    const result = await polishNote('raw text here')
    expect(result.title).toBe('Voice Note')
    expect(result.polished).toBe('raw text here')
  })

  it('truncates input to 25000 chars', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"title":"T","polished":"P"}' }],
    })
    const long = 'a'.repeat(30000)
    await polishNote(long)
    const calledText = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(calledText.length).toBeLessThan(26000)
  })
})
