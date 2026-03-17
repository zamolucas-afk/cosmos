import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notes = pgTable('notes', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  rawTranscript:      text('raw_transcript').notNull(),
  polishedTranscript: text('polished_transcript').notNull(),
  duration:           integer('duration').notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdCreatedAtIdx: index('notes_user_id_created_at_idx').on(table.userId, table.createdAt),
}))

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
