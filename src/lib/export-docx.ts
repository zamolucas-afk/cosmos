'use client'

interface ExportableNote {
  title: string
  emoji: string | null
  summary: string | null
  polishedTranscript: string
  actionItems: { text: string; assignee?: string }[] | unknown | null
  keyDecisions: string[] | unknown | null
  duration: number
  createdAt: Date
}

export async function exportNoteAsDocx(note: ExportableNote): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx')

  const children: any[] = []

  // Title
  children.push(new Paragraph({
    children: [new TextRun({ text: `${note.emoji ?? ''} ${note.title}`.trim(), bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
  }))

  // Date + duration
  const date = new Date(note.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  const mins = Math.floor(note.duration / 60)
  const secs = note.duration % 60
  children.push(new Paragraph({
    children: [new TextRun({ text: `${date} \u00b7 ${mins}:${secs.toString().padStart(2, '0')}`, italics: true, color: '666666', size: 20 })],
    spacing: { after: 400 },
  }))

  // Summary
  if (note.summary) {
    children.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }))
    children.push(new Paragraph({ text: note.summary, spacing: { after: 200 } }))
  }

  // Action Items
  const actionItems = Array.isArray(note.actionItems) ? note.actionItems as { text: string; assignee?: string }[] : []
  if (actionItems.length > 0) {
    children.push(new Paragraph({ text: 'Action Items', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }))
    actionItems.forEach(item => {
      children.push(new Paragraph({
        text: `${item.text}${item.assignee ? ` \u2014 @${item.assignee}` : ''}`,
        bullet: { level: 0 },
        spacing: { after: 80 },
      }))
    })
  }

  // Key Decisions
  const keyDecisions = Array.isArray(note.keyDecisions) ? note.keyDecisions as string[] : []
  if (keyDecisions.length > 0) {
    children.push(new Paragraph({ text: 'Key Decisions', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }))
    keyDecisions.forEach(d => {
      children.push(new Paragraph({ text: d, bullet: { level: 0 }, spacing: { after: 80 } }))
    })
  }

  // Transcript
  children.push(new Paragraph({ text: 'Transcript', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } }))
  // Split transcript into paragraphs
  const paragraphs = note.polishedTranscript.split('\n').filter(Boolean)
  paragraphs.forEach(p => {
    children.push(new Paragraph({ text: p, spacing: { after: 120 } }))
  })

  const doc = new Document({
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${note.title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
