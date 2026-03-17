// src/app/page.tsx — Server Component
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Navbar from '@/components/Navbar'
import NotesFeed from '@/components/NotesFeed'

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userNotes = await db.select().from(notes)
    .where(eq(notes.userId, session.user.id))
    .orderBy(desc(notes.createdAt))

  // Navbar is a Server Component — render it here, NOT inside NotesFeed (client component)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <NotesFeed notes={userNotes} />
    </div>
  )
}
