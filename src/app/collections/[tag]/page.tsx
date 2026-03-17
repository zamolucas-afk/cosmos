import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, collectionSummaries } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import Navbar from '@/components/Navbar'
import NoteCard from '@/components/NoteCard'

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { tag: encodedTag } = await params
  const tag = decodeURIComponent(encodedTag)
  const userId = session.user.id

  // Fetch all notes with this tag for this user
  const tagNotes = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        sql`${notes.tags} @> ARRAY[${tag}]::text[]`
      )
    )
    .orderBy(desc(notes.createdAt))

  // Fetch cached collection summary if available
  const [cached] = await db
    .select()
    .from(collectionSummaries)
    .where(
      and(
        eq(collectionSummaries.userId, userId),
        eq(collectionSummaries.tag, tag)
      )
    )
    .limit(1)

  const summary = cached?.summary ?? null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-text-muted text-sm uppercase tracking-widest mb-1">Collection</p>
          <h1 className="font-heading text-3xl text-text-primary capitalize">{tag}</h1>
          <p className="text-text-muted text-sm mt-1">{tagNotes.length} notes</p>
          {summary && (
            <p className="text-text-secondary text-sm mt-4 leading-relaxed border-l-2 border-accent-dim pl-3">
              {summary}
            </p>
          )}
        </div>

        {tagNotes.length === 0 ? (
          <p className="text-text-muted text-center py-16">No notes in this collection.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tagNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
