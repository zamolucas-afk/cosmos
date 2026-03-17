import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { subscriptions } from './subscriptions'

export const payments = pgTable('payments', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId:   uuid('subscription_id').references(() => subscriptions.id),
  amountCents:      integer('amount_cents').notNull(),
  payfastPaymentId: text('payfast_payment_id').notNull().unique(),
  status:           text('status').notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
