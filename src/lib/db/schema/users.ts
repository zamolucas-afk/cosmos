import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

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
  digestEnabled:  boolean('digest_enabled').default(true).notNull(),
  lastDigestSentAt: timestamp('last_digest_sent_at', { withTimezone: true }),
  resetToken:     text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
