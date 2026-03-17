import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const subscriptions = pgTable('subscriptions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  payfastToken:       text('payfast_token').notNull(),
  status:             text('status').notNull(),
  cancelAtPeriodEnd:  boolean('cancel_at_period_end').notNull().default(false),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd:   timestamp('current_period_end', { withTimezone: true }).notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
