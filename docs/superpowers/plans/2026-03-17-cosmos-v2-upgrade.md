# Cosmos V2 — Full Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Cosmos from a basic voice note taker into an intelligent personal knowledge base with AI Insights, Ask Your Notes, Smart Collections, 7-day trial model, and a richer UI.

**Architecture:** Extend the existing Next.js 16 + Drizzle + Neon + Claude stack. New columns on `notes` and `users` tables, new API routes for streaming Ask endpoints, updated Claude prompt for structured insights. All schema changes via Neon MCP `run_sql` (drizzle-kit push fails on Windows).

**Tech Stack:** Next.js 16.1.7, React 19, Drizzle ORM, Neon Postgres, @anthropic-ai/sdk, PayFast, Tailwind CSS v4, Zod v4, Vitest

**Spec:** `docs/superpowers/specs/2026-03-17-cosmos-v2-upgrade-design.md`
**Business Model:** `C:\Users\zamol\.claude\plans\delegated-petting-bonbon.md`

---

## Task 1: Database Schema Updates

**Files:**
- Modify: `src/lib/db/schema/users.ts`
- Modify: `src/lib/db/schema/notes.ts`
- Create: `src/lib/db/schema/collection-summaries.ts`
- Modify: `src/lib/db/schema/index.ts`
- Modify: `src/lib/db/schema/__tests__/schema.test.ts`

- [ ] **Step 1: Update users schema — add trial columns**

In `src/lib/db/schema/users.ts`, add `trialStartedAt` and `trialEndsAt` columns:

```ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  email:          text('email').notNull().unique(),
  passwordHash:   text('password_hash'),
  plan:           text('plan').notNull().default('free'),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
  trialEndsAt:    timestamp('trial_ends_at', { withTimezone: true }),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

- [ ] **Step 2: Update notes schema — add V2 columns**

In `src/lib/db/schema/notes.ts`, add emoji, summary, actionItems, keyDecisions, tags, isFavorite, viewed, updatedAt:

```ts
import { pgTable, uuid, text, integer, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notes = pgTable('notes', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  emoji:              text('emoji').default('📝'),
  rawTranscript:      text('raw_transcript').notNull(),
  polishedTranscript: text('polished_transcript').notNull(),
  summary:            text('summary'),
  actionItems:        jsonb('action_items').default([]),
  keyDecisions:       jsonb('key_decisions').default([]),
  tags:               text('tags').array().default([]),
  duration:           integer('duration').notNull(),
  isFavorite:         boolean('is_favorite').default(false).notNull(),
  viewed:             boolean('viewed').default(false).notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdCreatedAtIdx: index('notes_user_id_created_at_idx').on(table.userId, table.createdAt),
  tagsIdx: index('notes_tags_idx').using('gin', table.tags),
}))
```

- [ ] **Step 3: Create collection-summaries schema**

Create `src/lib/db/schema/collection-summaries.ts`:

```ts
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
```

- [ ] **Step 4: Update schema index re-exports**

In `src/lib/db/schema/index.ts`, add:

```ts
export * from './collection-summaries'
```

- [ ] **Step 5: Run DDL via Neon MCP**

Execute the following SQL statements via Neon MCP `run_sql` (projectId: `wandering-poetry-42994371`):

```sql
-- Users: trial columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Notes: V2 columns
ALTER TABLE notes ADD COLUMN IF NOT EXISTS emoji text DEFAULT '📝';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS action_items jsonb DEFAULT '[]';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS key_decisions jsonb DEFAULT '[]';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS viewed boolean DEFAULT false NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Collection summaries table
CREATE TABLE IF NOT EXISTS collection_summaries (
  tag text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (tag, user_id)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(polished_transcript, '')));

-- Tags GIN index
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING gin(tags);
```

- [ ] **Step 6: Update schema test**

Verify the test in `src/lib/db/schema/__tests__/schema.test.ts` still passes. Add test for new exports.

- [ ] **Step 7: Run tests and commit**

Run: `npm test`
Expected: All existing tests pass.

```bash
git add src/lib/db/schema/
git commit -m "feat: update DB schema for V2 — trial columns, note insights, collection summaries"
```

---

## Task 2: Zod Validation Schemas

**Files:**
- Create: `src/lib/validation/insights.ts`

- [ ] **Step 1: Create insights validation schemas**

Create `src/lib/validation/insights.ts`:

```ts
import { z } from 'zod'

export const ActionItemSchema = z.object({
  text: z.string(),
  assignee: z.string().optional(),
})

export const InsightsSchema = z.object({
  title: z.string(),
  emoji: z.string(),
  polished: z.string(),
  summary: z.string(),
  actionItems: z.array(ActionItemSchema),
  keyDecisions: z.array(z.string()),
  tags: z.array(z.string()),
})

export type ActionItem = z.infer<typeof ActionItemSchema>
export type Insights = z.infer<typeof InsightsSchema>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation/
git commit -m "feat: add Zod validation schemas for AI insights"
```

---

## Task 3: Claude Prompt Upgrade — AI Insights

**Files:**
- Modify: `src/lib/claude.ts`
- Modify: `src/lib/__tests__/claude.test.ts`

- [ ] **Step 1: Update claude.test.ts with new tests**

Add tests for the expanded response format:

```ts
// Add to existing test file
it('returns full insights when Claude responds correctly', async () => {
  const mockResponse = {
    title: 'Test Meeting',
    emoji: '🤖',
    polished: 'Polished text here.',
    summary: 'A summary of the meeting.',
    actionItems: [{ text: 'Follow up', assignee: 'Zama' }],
    keyDecisions: ['Use React'],
    tags: ['meeting', 'react'],
  }
  // mock client.messages.create to return JSON.stringify(mockResponse)
  const result = await polishNote('raw transcript')
  expect(result.title).toBe('Test Meeting')
  expect(result.emoji).toBe('🤖')
  expect(result.summary).toBe('A summary of the meeting.')
  expect(result.actionItems).toHaveLength(1)
  expect(result.tags).toContain('meeting')
})

it('falls back gracefully when insights fields are missing', async () => {
  // mock response with only title and polished (V1 format)
  const result = await polishNote('raw transcript')
  expect(result.title).toBeDefined()
  expect(result.polished).toBeDefined()
  expect(result.emoji).toBe('📝') // fallback
  expect(result.actionItems).toEqual([])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/claude.test.ts`
Expected: FAIL — polishNote doesn't return new fields yet.

- [ ] **Step 3: Update polishNote function**

Rewrite `src/lib/claude.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import { InsightsSchema, type Insights } from '@/lib/validation/insights'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an AI assistant that processes voice note transcripts.
Given a raw transcript, return a JSON object with these fields:
- title: concise, descriptive title (3-6 words, no quotes or punctuation at the end)
- emoji: single emoji that best represents the topic
- polished: cleaned-up transcript with proper grammar, punctuation, and paragraph breaks
- summary: 2-3 sentence overview of the key points
- actionItems: array of { text, assignee? } for any action items mentioned (empty array if none)
- keyDecisions: array of strings for decisions made (empty array if none)
- tags: array of 2-5 lowercase topic tags (e.g., "pricing", "hiring", "s4hana")

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`

type PolishResult = {
  title: string
  emoji: string
  polished: string
  summary: string
  actionItems: { text: string; assignee?: string }[]
  keyDecisions: string[]
  tags: string[]
}

const FALLBACK: Omit<PolishResult, 'polished'> = {
  title: 'Voice Note',
  emoji: '📝',
  summary: '',
  actionItems: [],
  keyDecisions: [],
  tags: [],
}

export async function polishNote(rawTranscript: string): Promise<PolishResult> {
  try {
    const truncated = rawTranscript.slice(0, 25000)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: truncated }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : null
    if (!text) return { ...FALLBACK, polished: rawTranscript }

    const parsed = JSON.parse(text)
    const validated = InsightsSchema.safeParse(parsed)

    if (validated.success) {
      return validated.data
    }

    // Partial fallback: try to extract title and polished at minimum
    return {
      title: typeof parsed.title === 'string' ? parsed.title : FALLBACK.title,
      emoji: typeof parsed.emoji === 'string' ? parsed.emoji : FALLBACK.emoji,
      polished: typeof parsed.polished === 'string' ? parsed.polished : rawTranscript,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }
  } catch {
    return { ...FALLBACK, polished: rawTranscript }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/__tests__/claude.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/claude.ts src/lib/__tests__/claude.test.ts
git commit -m "feat: upgrade Claude prompt for AI insights — emoji, summary, action items, tags"
```

---

## Task 4: Update saveNote — Store Insights + New Limits

**Files:**
- Modify: `src/lib/actions/notes.ts`
- Modify: `src/lib/actions/__tests__/notes.test.ts`

- [ ] **Step 1: Update notes.test.ts with trial/free limit tests**

Add tests for:
- Trial limit: 20 total notes since trial start
- Free limit: 3 notes/month (changed from 10)
- Pro: no limit
- Verify insights fields are passed to insert

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/actions/__tests__/notes.test.ts`

- [ ] **Step 3: Rewrite saveNote and rename getMonthlyRecordingCount**

Update `src/lib/actions/notes.ts`:

```ts
'use server'

import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { polishNote } from '@/lib/claude'
import { redirect } from 'next/navigation'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getMonthlyNoteCount(userId: string): Promise<number> {
  const result = await db.select({ count: count() }).from(notes)
    .where(and(eq(notes.userId, userId), gte(notes.createdAt, startOfMonth())))
  return result[0]?.count ?? 0
}

export async function getTrialNoteCount(userId: string, trialStartedAt: Date): Promise<number> {
  const result = await db.select({ count: count() }).from(notes)
    .where(and(eq(notes.userId, userId), gte(notes.createdAt, trialStartedAt)))
  return result[0]?.count ?? 0
}

export async function saveNote(rawTranscript: string, duration: number): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  // DB-authoritative plan check
  const [user] = await db.select({
    plan: users.plan,
    trialStartedAt: users.trialStartedAt,
  }).from(users).where(eq(users.id, session.user.id)).limit(1)

  if (!user) throw new Error('User not found')

  if (user.plan === 'trial' && user.trialStartedAt) {
    const count = await getTrialNoteCount(session.user.id, user.trialStartedAt)
    if (count >= 20) throw new Error('Trial limit reached (20 notes). Subscribe to Pro for unlimited notes.')
  } else if (user.plan === 'free') {
    const count = await getMonthlyNoteCount(session.user.id)
    if (count >= 3) throw new Error('Monthly note limit reached. Upgrade to Pro for unlimited notes.')
  }

  const { title, emoji, polished, summary, actionItems, keyDecisions, tags } = await polishNote(rawTranscript)

  const [note] = await db.insert(notes).values({
    userId: session.user.id,
    title,
    emoji,
    rawTranscript,
    polishedTranscript: polished,
    summary,
    actionItems,
    keyDecisions,
    tags,
    duration,
    viewed: false,
  }).returning({ id: notes.id })

  return { id: note.id }
}

export async function deleteNote(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
  redirect('/')
}

export async function toggleFavorite(noteId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const [note] = await db.select({ isFavorite: notes.isFavorite })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .limit(1)

  if (!note) throw new Error('Note not found')

  await db.update(notes)
    .set({ isFavorite: !note.isFavorite, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
}

export async function markViewed(noteId: string) {
  const session = await auth()
  if (!session?.user) return

  await db.update(notes)
    .set({ viewed: true })
    .where(and(
      eq(notes.id, noteId),
      eq(notes.userId, session.user.id),
      eq(notes.viewed, false),
    ))
}
```

- [ ] **Step 4: Run tests and fix any failures**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/notes.ts src/lib/actions/__tests__/notes.test.ts
git commit -m "feat: saveNote stores AI insights, new trial/free limits (20/3)"
```

---

## Task 5: Language Rename — "Recording" to "Note"

**Files:**
- Modify: `src/components/RecordingOrb.tsx` (aria-labels)
- Modify: `src/components/RecordingScreen.tsx` (labels, error messages)
- Modify: `src/components/NotesFeed.tsx` (empty state, FAB label)
- Modify: `src/components/PricingCard.tsx` (feature text)
- Modify: `src/components/AccountView.tsx` (usage text)
- Modify: `src/components/Navbar.tsx` (badge text)
- Modify: `src/app/record/page.tsx` (error message)

- [ ] **Step 1: Update all "recording" references to "note"**

Search and replace across all listed files:
- "Start recording" → "Start note"
- "Stop recording" → "Save note"
- "New recording" → "New Note"
- "Nothing recorded yet. Tap the orb to begin." → "No notes yet. Tap to create one."
- "10 recordings / month" → Free: "3 notes / month", Pro: "Unlimited notes"
- "recordings used this month" → "notes used this month"
- "recording limit reached" → "note limit reached"
- `getMonthlyRecordingCount` → `getMonthlyNoteCount` (already renamed in Task 4)

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass (update any test assertions that check for old text).

- [ ] **Step 3: Commit**

```bash
git add src/components/ src/app/record/
git commit -m "refactor: rename 'recording' to 'note' across all UI"
```

---

## Task 6: Business Model — Trial System

**Files:**
- Modify: `src/lib/actions/auth.ts` (registerAction sets trial plan)
- Modify: `src/lib/auth/auth.config.ts` (JWT callback includes trial fields)
- Modify: `src/types/next-auth.d.ts` (session type augmentation)
- Modify: `src/lib/actions/subscription.ts` (trial subscription with R0 initial, R149 recurring)
- Modify: `src/app/api/payfast/notify/route.ts` (amount check R149, trial→pro transition)
- Create: `src/lib/trial.ts` (trial expiry check helper)

- [ ] **Step 1: Create trial helper**

Create `src/lib/trial.ts`:

```ts
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function checkAndExpireTrial(userId: string): Promise<'trial' | 'free' | 'pro'> {
  const [user] = await db.select({ plan: users.plan, trialEndsAt: users.trialEndsAt })
    .from(users).where(eq(users.id, userId)).limit(1)

  if (!user || user.plan !== 'trial') return user?.plan as 'free' | 'pro' ?? 'free'

  if (user.trialEndsAt && user.trialEndsAt <= new Date()) {
    // Trial expired — check if they have an active subscription
    const [sub] = await db.select({ status: subscriptions.status })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)

    const newPlan = sub ? 'pro' : 'free'
    await db.update(users).set({ plan: newPlan }).where(eq(users.id, userId))
    return newPlan
  }

  return 'trial'
}
```

- [ ] **Step 2: Update registerAction for trial plan**

In `src/lib/actions/auth.ts`, update the insert in `registerAction` to set `plan: 'trial'`, `trialStartedAt: new Date()`, `trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`.

- [ ] **Step 3: Update auth.config.ts JWT callback**

**CRITICAL: auth.config.ts runs in edge middleware. Do NOT import trial.ts, db, drizzle, or any Node.js-only module here.** Only access properties already on the `user` object.

Add `trialEndsAt` to the JWT token so the Navbar can show countdown without a DB query:

```ts
jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.plan = (user as any).plan ?? 'free'
    token.trialEndsAt = (user as any).trialEndsAt ?? null
  }
  return token
},
session({ session, token }) {
  session.user.id = token.id as string
  session.user.plan = (token.plan as 'free' | 'trial' | 'pro') ?? 'free'
  session.user.trialEndsAt = token.trialEndsAt as string | null
  return session
},
```

- [ ] **Step 4: Update next-auth.d.ts type augmentation**

```ts
import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    plan?: 'free' | 'trial' | 'pro'
    trialEndsAt?: Date | null
  }
  interface Session {
    user: {
      id: string
      plan: 'free' | 'trial' | 'pro'
      trialEndsAt: string | null
    } & DefaultSession['user']
  }
}
```

- [ ] **Step 5: Update subscription.ts — R149, trial billing**

Change `initiateSubscription` to use `amount: '149.00'`, `recurring_amount: '149.00'`, and set `initial_amount: '0'` for trial, `billing_date` to 8 days from now.

- [ ] **Step 6: Update PayFast ITN webhook — R149 amount check**

In `src/app/api/payfast/notify/route.ts`:
- Change amount verification from `99.00` to `149.00`
- Change `amountCents: 9900` to `amountCents: 14900` in all payment insert calls

- [ ] **Step 7: Add skip-trial flow to registration**

In `src/lib/actions/auth.ts`, after user insert, the flow should be:
- Default: `plan: 'trial'`, `trialStartedAt: now()`, `trialEndsAt: now + 7 days`
- Registration page redirects to a card capture page after account creation
- Card capture page has a "Skip" link that calls a `skipTrial` server action setting `plan: 'free'` and clearing trial dates
- If card captured successfully via PayFast, user stays on `plan: 'trial'`

Create the card capture page at `src/app/start-trial/page.tsx` — explains the trial, shows "Start 7-day free trial" button (→ PayFast card tokenization) and "Skip, use free plan" link (→ skipTrial action → redirect to home).

- [ ] **Step 8: Add daily Ask counter columns to users table**

Add columns to track Ask rate limiting:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_ask_count integer DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ask_date date;
```

Update `src/lib/db/schema/users.ts` to add:
```ts
dailyAskCount: integer('daily_ask_count').default(0).notNull(),
lastAskDate: timestamp('last_ask_date', { mode: 'date' }),
```

Run DDL via Neon MCP `run_sql`.

- [ ] **Step 9: Run tests and commit**

Run: `npm test`

```bash
git add src/lib/ src/types/ src/app/api/payfast/ src/app/start-trial/
git commit -m "feat: implement 7-day trial system — trial plan, R149 pricing, auto-expiry, skip-trial"
```

**Deferred to post-V2 launch:**
- Day 7 trial reminder notification (in-app banner or email)
- 2-day grace period on failed payments (currently falls back to free immediately)

---

## Task 7: Richer NoteCard Component

**Files:**
- Modify: `src/components/NoteCard.tsx`
- Create: `src/components/TagPill.tsx`
- Create: `src/components/NoteMenu.tsx`
- Modify: `src/components/__tests__/NoteCard.test.tsx`

- [ ] **Step 1: Create TagPill component**

Create `src/components/TagPill.tsx`:

```ts
'use client'

export default function TagPill({ tag, onClick }: { tag: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] px-2 py-0.5 rounded-full bg-accent-dim/30 text-accent-light
        border border-accent-dim/20 hover:bg-accent-dim/50 transition-colors cursor-pointer"
    >
      {tag}
    </button>
  )
}
```

- [ ] **Step 2: Create NoteMenu component**

Create `src/components/NoteMenu.tsx` — a three-dot dropdown with Favorite, Copy Summary, Delete options.

- [ ] **Step 3: Rewrite NoteCard with emoji, time, duration, unread dot, menu**

Update `src/components/NoteCard.tsx` to match the mockup design: emoji square, title, time (format 'h:mm a'), duration (formatDuration), unread dot, favorite star, ••• menu.

- [ ] **Step 4: Update NoteCard tests**

Update `src/components/__tests__/NoteCard.test.tsx` for new props (emoji, viewed, isFavorite).

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/
git commit -m "feat: richer NoteCard — emoji, time, duration, unread dot, menu"
```

---

## Task 8: Category Tabs + Updated NotesFeed

**Files:**
- Create: `src/components/NoteTabs.tsx`
- Modify: `src/components/NotesFeed.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create NoteTabs component**

Horizontal scrollable tabs: All, Meetings, Favorites, Collections. Active tab highlighted with accent-violet.

- [ ] **Step 2: Update NotesFeed to support tab filtering**

Add tab state. Filter notes by:
- All: no filter
- Meetings: `note.tags` overlaps with meeting keywords list
- Favorites: `note.isFavorite === true`
- Collections: show CollectionCard list instead of notes

- [ ] **Step 3: Update home page to pass full note data**

The home page query in `src/app/page.tsx` already fetches all notes. Update the `select()` to include new columns (emoji, tags, isFavorite, viewed, summary, duration).

- [ ] **Step 4: Replace FAB with full-width "New Note" CTA**

In NotesFeed, replace the circular FAB with a full-width gradient button fixed to the bottom.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: category tabs (All/Meetings/Favorites/Collections) + New Note CTA"
```

---

## Task 9: Note Detail — Tabbed View with Insights

**Files:**
- Create: `src/components/NoteDetailTabs.tsx`
- Create: `src/components/InsightsView.tsx`
- Modify: `src/components/NoteDetail.tsx`
- Modify: `src/app/notes/[id]/page.tsx`

- [ ] **Step 1: Create InsightsView component**

Renders: summary paragraph, action items list (with checkboxes), key decisions list, tag pills. Gracefully handles null/empty fields.

- [ ] **Step 2: Create NoteDetailTabs component**

Three tabs: Summary | Transcript | Ask. Summary shows InsightsView. Transcript shows polished text (current view). Ask placeholder for Task 11.

- [ ] **Step 3: Refactor NoteDetail.tsx**

Update header: back arrow, emoji, favorite heart toggle, copy button, ••• menu. Render NoteDetailTabs as the body.

- [ ] **Step 4: Update note detail page to call markViewed**

In `src/app/notes/[id]/page.tsx`, call `markViewed(id)` after rendering (fire-and-forget via `after()` or inline).

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/ src/app/notes/
git commit -m "feat: note detail with tabs — Summary/Transcript/Ask + insights view"
```

---

## Task 10: Navbar + Pricing + Account Updates

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/PricingCard.tsx`
- Modify: `src/components/AccountView.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/account/page.tsx`

- [ ] **Step 1: Update Navbar for trial/free/pro badges**

- Trial: `Trial {used}/20 · {days}d left` (violet badge with countdown)
- Free: `Free {used}/3`
- Pro: `Pro` (accent-light badge)

Use `checkAndExpireTrial` from `src/lib/trial.ts` to ensure expired trials are caught.

- [ ] **Step 2: Update PricingCard for new pricing**

Single Pro card at R149/month. Show "Start 7-day free trial" CTA. Feature comparison list updated with V2 features (AI Insights, Ask Your Notes, Smart Collections, unlimited notes).

- [ ] **Step 3: Update AccountView for trial status**

Show trial countdown if on trial. Show "Subscribe now" if trial active. Show cancel button if pro. Show "Upgrade" if free.

- [ ] **Step 4: Update pricing and account pages**

Pass trial data through. Update queries to use new columns.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/ src/app/pricing/ src/app/account/
git commit -m "feat: update Navbar/Pricing/Account for trial model + R149 pricing"
```

---

## Task 11: Ask Your Notes — API Routes + UI

**Files:**
- Create: `src/app/api/ask/route.ts`
- Create: `src/app/api/ask/[noteId]/route.ts`
- Create: `src/components/AskChat.tsx`
- Modify: `src/components/NoteDetailTabs.tsx` (wire up Ask tab)
- Modify: `src/components/NotesFeed.tsx` (wire up Ask tab in feed)

- [ ] **Step 1: Create global Ask API route**

Create `src/app/api/ask/route.ts`:

```ts
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { notes, users } from '@/lib/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { checkAndExpireTrial } from '@/lib/trial'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const plan = await checkAndExpireTrial(session.user.id)

  // Rate limit for free users: 5/day
  if (plan === 'free') {
    const [user] = await db.select({ dailyAskCount: users.dailyAskCount, lastAskDate: users.lastAskDate })
      .from(users).where(eq(users.id, session.user.id)).limit(1)

    const today = new Date().toISOString().split('T')[0]
    const lastDate = user?.lastAskDate ? new Date(user.lastAskDate).toISOString().split('T')[0] : null

    if (lastDate === today && (user?.dailyAskCount ?? 0) >= 5) {
      return new Response('Daily Ask limit reached (5/day). Upgrade to Pro for unlimited.', { status: 429 })
    }

    // Increment counter (reset if new day)
    await db.update(users).set({
      dailyAskCount: lastDate === today ? sql`daily_ask_count + 1` : 1,
      lastAskDate: sql`CURRENT_DATE`,
    }).where(eq(users.id, session.user.id))
  }

  const { question } = await req.json()
  if (!question || typeof question !== 'string') {
    return new Response('Question is required', { status: 400 })
  }

  // Full-text search for matching notes
  const matchingNotes = await db.select({
    id: notes.id,
    title: notes.title,
    polishedTranscript: notes.polishedTranscript,
    summary: notes.summary,
    tags: notes.tags,
    createdAt: notes.createdAt,
  }).from(notes).where(
    and(
      eq(notes.userId, session.user.id),
      sql`to_tsvector('english', coalesce(${notes.title}, '') || ' ' || coalesce(${notes.polishedTranscript}, ''))
          @@ plainto_tsquery('english', ${question})`
    )
  ).orderBy(desc(notes.createdAt)).limit(10)

  // Build context from matching notes
  const context = matchingNotes.map(n => {
    const transcript = n.polishedTranscript?.slice(0, 2000) ?? ''
    const date = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'unknown date'
    return `[Note: "${n.title}" (${date}, ID: ${n.id})]\n${n.summary || ''}\n${transcript}`
  }).join('\n\n---\n\n')

  const systemPrompt = `You are a helpful AI assistant. The user is asking a question about their voice notes.
Here are the relevant notes from their history:

${context || 'No matching notes found.'}

Answer the user's question based on these notes. When referencing a note, use this format:
[Note: "Title" (date)](/notes/ID)

If no notes match, say so honestly.`

  // Stream response
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 2: Create note-level Ask API route**

Create `src/app/api/ask/[noteId]/route.ts` — similar but loads only the single note's full transcript as context. Verify ownership.

- [ ] **Step 3: Create AskChat component**

Create `src/components/AskChat.tsx` — client component with text input, submit handler, streaming response display. Accepts optional `noteId` prop (null = global, string = single note).

Uses `fetch('/api/ask', { method: 'POST', body: JSON.stringify({ question }) })` and reads the SSE stream with `EventSource` or manual stream reader.

- [ ] **Step 4: Wire up Ask in NotesFeed**

When "Ask" tab is selected in NotesFeed, render AskChat (global mode) instead of notes list.

- [ ] **Step 5: Wire up Ask in NoteDetailTabs**

When "Ask" tab is selected in note detail, render AskChat with `noteId` prop.

- [ ] **Step 6: Run tests and commit**

```bash
git add src/app/api/ask/ src/components/AskChat.tsx src/components/NoteDetailTabs.tsx src/components/NotesFeed.tsx
git commit -m "feat: Ask Your Notes — global + per-note AI chat with streaming"
```

---

## Task 12: Smart Collections

**Files:**
- Create: `src/components/CollectionCard.tsx`
- Create: `src/app/api/collections/[tag]/summary/route.ts`
- Modify: `src/components/NotesFeed.tsx` (Collections tab view)
- Create: `src/app/collections/[tag]/page.tsx`

- [ ] **Step 1: Create CollectionCard component**

Shows tag name (capitalized), note count, and cached summary preview (truncated to 100 chars). Links to `/collections/{tag}`.

- [ ] **Step 2: Create collection summary API route**

`POST /api/collections/[tag]/summary` — checks cache in `collection_summaries` table, generates via Claude if stale, caches result.

- [ ] **Step 3: Create collection page**

`src/app/collections/[tag]/page.tsx` — async server component. Queries notes where `tags @> ARRAY[tag]`. Shows Navbar + collection summary + notes list.

- [ ] **Step 4: Wire Collections tab in NotesFeed**

When "Collections" tab is active, query unique tags with 3+ notes, display CollectionCard grid.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/CollectionCard.tsx src/app/api/collections/ src/app/collections/ src/components/NotesFeed.tsx
git commit -m "feat: Smart Collections — auto-generated from tags with AI summaries"
```

---

## Task 13: Copy Summary Feature

**Files:**
- Modify: `src/components/NoteDetail.tsx`

- [ ] **Step 1: Add Copy Summary button to note detail**

When clicked, format the note's summary + action items + key decisions as Markdown and copy to clipboard using `navigator.clipboard.writeText()`. Show toast "Copied!".

Markdown format:
```
## {title}

{summary}

### Action Items
- [ ] {item.text} {item.assignee ? `(@${item.assignee})` : ''}

### Key Decisions
- {decision}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteDetail.tsx
git commit -m "feat: copy summary as Markdown to clipboard"
```

---

## Task 14: Update Mockup + CLAUDE.md

**Files:**
- Modify: `docs/mockup-upgraded-feed.html` (update with "Note" language)
- Modify: `CLAUDE.md` (final V2 documentation)

- [ ] **Step 1: Update mockup with "Note" language**

Replace "New Recording" → "New Note" in the mockup HTML.

- [ ] **Step 2: Update CLAUDE.md with final V2 state**

Add documentation for:
- New DB columns and tables
- New API routes (`/api/ask`, `/api/ask/[noteId]`, `/api/collections/[tag]/summary`)
- New components (NoteTabs, NoteDetailTabs, InsightsView, AskChat, TagPill, NoteMenu, CollectionCard)
- Updated business model (trial/free/pro)
- Updated limits (trial: 20, free: 3/month, ask: 5/day free)

- [ ] **Step 3: Commit**

```bash
git add docs/ CLAUDE.md
git commit -m "docs: update CLAUDE.md and mockup for V2 final state"
```

---

## Task 15: Full Integration Test + Build Verification

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (existing + new).

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual E2E verification via Playwright**

Test the full flow:
1. Register → trial plan active, badge shows "Trial 0/20 · 7d left"
2. Create a note → emoji, summary, action items, tags populated
3. View note detail → Summary/Transcript/Ask tabs work
4. Tap Ask tab → type question → streaming response with citations
5. Check Collections tab → auto-generated from tags
6. Toggle favorite → star appears/disappears
7. Sign out → sign in → works (NEXT_REDIRECT fix verified)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Cosmos V2 — AI insights, Ask Your Notes, Smart Collections, trial model"
```

---

## Summary: Task Dependencies

```
Task 1 (Schema) ──┬── Task 2 (Zod)
                   │       │
                   │   Task 3 (Claude) ── Task 4 (saveNote)
                   │
                   ├── Task 5 (Language rename) — independent
                   │
                   ├── Task 6 (Trial system)
                   │
                   ├── Task 7 (NoteCard) ── Task 8 (Feed + Tabs)
                   │
                   ├── Task 9 (Note Detail)
                   │
                   ├── Task 10 (Navbar/Pricing/Account)
                   │
                   ├── Task 11 (Ask Your Notes) — depends on Task 3, 4
                   │
                   ├── Task 12 (Collections) — depends on Task 4, 8
                   │
                   ├── Task 13 (Copy Summary) — depends on Task 9
                   │
                   └── Task 14 (Docs) ── Task 15 (Final verification)
```

**Parallelizable groups:**
- Tasks 2+3 can run in parallel with Task 5 and Task 6
- Tasks 7+8+9+10 can run in parallel after Task 4
- Tasks 11+12+13 can run in parallel after their dependencies
