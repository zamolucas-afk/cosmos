import { pgTable, uuid, text, integer, timestamp, index, boolean, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notes = pgTable('notes', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  rawTranscript:      text('raw_transcript').notNull(),
  polishedTranscript: text('polished_transcript').notNull(),
  emoji:              text('emoji').default('📝'),
  summary:            text('summary'),
  actionItems:        jsonb('action_items').default([]),
  keyDecisions:       jsonb('key_decisions').default([]),
  tags:               text('tags').array().default([]),
  duration:           integer('duration').notNull(),
  isFavorite:         boolean('is_favorite').default(false).notNull(),
  viewed:             boolean('viewed').default(false).notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdCreatedAtIdx: index('notes_user_id_created_at_idx').on(table.userId, table.createdAt),
  tagsIdx:            index('notes_tags_idx').using('gin', table.tags),
}))

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
