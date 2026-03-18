'use client'

interface ShareableNote {
  id: string
  title: string
  emoji: string
  summary: string | null
  polishedTranscript: string
  actionItems: { text: string; assignee?: string }[] | null
  keyDecisions: string[] | null
}

function buildShareText(note: ShareableNote): string {
  const lines: string[] = []
  lines.push(`${note.emoji} ${note.title}`)
  lines.push('')
  if (note.summary) {
    lines.push('## Summary')
    lines.push(note.summary)
    lines.push('')
  }
  if (note.actionItems?.length) {
    lines.push('## Action Items')
    note.actionItems.forEach(item => {
      lines.push(`- ${item.text}${item.assignee ? ` @${item.assignee}` : ''}`)
    })
    lines.push('')
  }
  if (note.keyDecisions?.length) {
    lines.push('## Key Decisions')
    note.keyDecisions.forEach(d => lines.push(`- ${d}`))
    lines.push('')
  }
  return lines.join('\n')
}

export async function shareNote(note: ShareableNote): Promise<'shared' | 'copied'> {
  const text = buildShareText(note)
  const url = `${window.location.origin}/notes/${note.id}`

  if (navigator.share) {
    try {
      await navigator.share({ title: `${note.emoji} ${note.title}`, text, url })
      return 'shared'
    } catch {
      // User cancelled or share failed — fall back to clipboard
    }
  }

  await navigator.clipboard.writeText(text)
  return 'copied'
}
