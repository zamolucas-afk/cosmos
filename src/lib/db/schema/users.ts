import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  email:          text('email').notNull().unique(),
  passwordHash:   text('password_hash'),
  plan:           text('plan').notNull().default('free'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
  trialEndsAt:    timestamp('trial_ends_at', { withTimezone: true }),
  dailyAskCount:  integer('daily_ask_count').default(0).notNull(),
  lastAskDate:    timestamp('last_ask_date', { withTimezone: true }),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
