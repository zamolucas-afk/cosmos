import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'

export const collectionSummaries = pgTable('collection_summaries', {
  tag:         text('tag').notNull(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  summary:     text('summary').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.tag] }),
}))

export type CollectionSummary = typeof collectionSummaries.$inferSelect
