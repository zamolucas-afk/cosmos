# Cosmos — Claude Context

## What This Is

Cosmos is a standalone AI-powered voice note taker app. Users record voice notes via the Web Speech API, Claude polishes the transcript and generates a title, and notes are stored in Neon Postgres. Freemium model: 10 recordings/month free, R99/month Pro via PayFast.

---

## Tech Stack

- **Next.js 16.1.7** — App Router, TypeScript, `src/` directory, `@/*` import alias
- **React 19** with `useActionState` for form handling
- **Tailwind CSS v4** — configured entirely via `@theme {}` in `src/app/globals.css`; no `tailwind.config.ts`
- **Neon Postgres** — `@neondatabase/serverless`, HTTP driver for reads, WebSocket Pool for transactions
- **Drizzle ORM** — type-safe ORM + `drizzle-kit` for migrations
- **Auth.js v5** (`next-auth@5.0.0-beta.25`) — JWT sessions, Credentials provider, `@auth/drizzle-adapter`
- **`bcryptjs`** — password hashing (pure JS, edge-compatible — never use `bcrypt`)
- **`@anthropic-ai/sdk`** — Claude claude-sonnet-4-6 for transcript polishing + title generation
- **Web Speech API** — browser-native real-time transcription (no external ASR service)
- **AudioContext / AnalyserNode** — waveform amplitude visualization
- **Zod v4** — validation (use `.issues` not `.errors` on ZodError)
- **`date-fns` v4** — date formatting
- **`lucide-react`** — icons
- **`clsx` + `tailwind-merge`** — conditional class utilities (`cn()` in `src/lib/utils.ts`)
- **Vitest v4 + React Testing Library** — test runner
- **Netlify** — hosting via `@netlify/plugin-nextjs` v5

---

## Critical "Gotchas"

### Tailwind v4
No `tailwind.config.ts` — it does not exist and must not be created. All tokens live in `@theme {}` in `src/app/globals.css`. Token names like `--color-accent-violet` become `bg-accent-violet`, `text-accent-violet`, etc.

### bcryptjs, NOT bcrypt
Always `bcryptjs`. Never `bcrypt` — native C++ bindings crash in edge runtimes.

### auth.config.ts must be edge-safe
`src/lib/auth/auth.config.ts` runs in edge middleware. It must **never** import `bcryptjs`, Drizzle, `@/lib/db`, or any Node.js-only module. Only `auth.ts` (the Node.js-only file) imports those.

### JWT sessions — no sessions table
Strategy is `jwt`. There is no `sessions` table. Session data lives in an HTTP-only cookie. `session.user.plan` is cosmetic — always re-read plan from DB before enforcing limits.

### DB-authoritative plan enforcement
`saveNote` reads `users.plan` directly from the database before checking limits. **Never trust `session.user.plan` for access control** — JWTs go stale after upgrades/downgrades.

### Neon HTTP driver has no transactions
`db` (HTTP) does not support multi-statement transactions. Use `poolDb` (WebSocket Pool) from `src/lib/db/index.ts` for atomic operations (e.g., subscription upgrades in the ITN webhook).

### Zod v4 API
Use `.issues` (not `.errors`) on a `ZodError`.

### Server Actions with `useActionState`
Server actions used with `useActionState` must have the signature `(prevState, formData)`:
```ts
export async function loginAction(_prevState: unknown, formData: FormData) { ... }
```
Do NOT use `as unknown as (formData: FormData) => Promise<void>` casts — they are not needed with the correct signature.

### Next.js 16 dynamic params
`params` and `searchParams` are `Promise<...>` in Next.js 16 App Router:
```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### PayFast signature
`generateSignature` in `src/lib/payfast.ts` sorts params alphabetically, URL-encodes values (spaces as `+`), appends passphrase. MD5 of the resulting string.

### Claude API
`polishNote` in `src/lib/claude.ts` uses `claude-sonnet-4-6`, truncates input to 25k chars, parses JSON response, falls back to `{ title: 'Voice Note', polished: rawTranscript }` on any error.

### Web Speech API
Browser-only — not available in Node.js or tests. All recorder logic lives in `src/hooks/useRecorder.ts` which should only be used inside `'use client'` components. The hook uses `SpeechRecognition` for transcription and `AudioContext`/`AnalyserNode` for waveform amplitude. SpeechRecognition types are typed as `any` in the hook since the Web Speech API TS types are inconsistent across environments.

### Navbar is an async Server Component
Never import `Navbar` inside a `'use client'` component. Always render it in a parent server component (page.tsx) and pass children down if needed.

### DrizzleAdapter type cast
When passing `DrizzleAdapter(db)` to NextAuth config, cast it: `adapter: DrizzleAdapter(db) as NextAuthConfig['adapter']`.

---

## Design System — Deep Space

| Token | Hex | Tailwind class |
|---|---|---|
| Background | `#050508` | `bg-background` |
| Surface | `#0d0d1a` | `bg-surface` |
| Surface raised | `#14142a` | `bg-surface-raised` |
| Accent violet | `#7c3aed` | `bg-accent-violet`, `text-accent-violet` |
| Accent light | `#a855f7` | `text-accent-light` |
| Accent dim | `#4c1d95` | `border-accent-dim` |
| Text primary | `#f0f0ff` | `text-text-primary` |
| Text secondary | `#9090b0` | `text-text-secondary` |
| Text muted | `#50507a` | `text-text-muted` |
| Success | `#34d399` | `text-success` |
| Error | `#f87171` | `text-error` |

### Typography
- **Headings:** Space Grotesk — `font-heading` class
- **Body:** Inter — `font-body` class
- Both loaded via `next/font/google` in `src/app/layout.tsx` with `display: 'swap'`

### Glow effects
Violet glows are applied inline: `style={{ boxShadow: '0 0 30px #7c3aed88' }}`

---

## Project Structure

```
src/
  app/
    login/page.tsx              # Login form (client, useActionState)
    register/page.tsx           # Register form (client, useActionState)
    account/page.tsx            # Account page (server — renders Navbar + AccountView)
    pricing/page.tsx            # Pricing page (server — Free vs Pro cards)
    record/page.tsx             # Recording page (server — pre-flight limit check)
    notes/[id]/page.tsx         # Note detail (server — fetches + ownership check)
    api/
      auth/[...nextauth]/route.ts       # Auth.js route handler
      ask/route.ts                      # Global Ask Your Notes — SSE streaming
      ask/[noteId]/route.ts             # Per-note Ask — SSE streaming
      collections/[tag]/summary/route.ts # Collection AI summary generation
      payfast/notify/route.ts           # PayFast ITN webhook
      payfast/__tests__/notify.test.ts
    collections/[tag]/page.tsx  # Collection detail (server — tag-filtered notes)
    page.tsx                    # Home — notes feed (server component)
    layout.tsx                  # Root layout (fonts, html/body)
    globals.css                 # Tailwind v4 @theme tokens
  components/
    Navbar.tsx              # Async server component — trial/free/pro badge, sign out
    NoteCard.tsx            # Rich note card — emoji, time, duration, unread dot, menu
    NotesFeed.tsx           # Client shell — tabs + search + list + New Note CTA
    NoteTabs.tsx            # Category tabs (All/Meetings/Favorites/Collections)
    NoteDetail.tsx          # Note detail — header, tabs, copy summary, favorite, delete
    NoteDetailTabs.tsx      # Summary | Transcript | Ask tabs
    InsightsView.tsx        # AI insights — summary, action items, key decisions, tags
    AskChat.tsx             # Chat UI for Ask Your Notes (global + per-note)
    TagPill.tsx             # Small tag pill button
    NoteMenu.tsx            # Three-dot dropdown (favorite, delete)
    CollectionCard.tsx      # Smart collection card (tag, count, summary)
    SearchBar.tsx           # Client-side note filter
    StarField.tsx           # Animated star background (CSS divs)
    Waveform.tsx            # Audio amplitude bars (client, requestAnimationFrame)
    RecordingOrb.tsx        # Tap-to-record orb — idle/recording/thinking states
    RecordingScreen.tsx     # Full recording UI (client) — includes FallbackTextInput
    PricingCard.tsx         # Trial/Free/Pro pricing cards (client)
    AccountView.tsx         # Account/billing view — trial countdown (client)
    __tests__/NoteCard.test.tsx
  hooks/
    useRecorder.ts          # MediaRecorder + SpeechRecognition + AudioContext hook
  lib/
    auth/
      auth.ts               # Auth.js full config — Node.js only
      auth.config.ts        # Edge-safe config subset (middleware)
    actions/
      auth.ts               # registerAction (sets trial plan), loginAction, signOutAction
      notes.ts              # saveNote (insights + limits), deleteNote, toggleFavorite, markViewed, getMonthlyNoteCount
      subscription.ts       # initiateSubscription (R149), cancelSubscription
      __tests__/auth.test.ts
      __tests__/notes.test.ts
    db/
      index.ts              # db (HTTP) + poolDb (Pool) exports
      schema/
        users.ts            # + trialStartedAt, trialEndsAt, dailyAskCount, lastAskDate
        notes.ts            # + emoji, summary, actionItems, keyDecisions, tags, isFavorite, viewed, updatedAt
        subscriptions.ts
        payments.ts
        collection-summaries.ts  # Cached AI collection summaries
        auth-tables.ts
        index.ts            # re-exports all
      __tests__/schema.test.ts
    validation/
      insights.ts           # Zod schemas: InsightsSchema, ActionItemSchema
    trial.ts                # checkAndExpireTrial helper
    claude.ts               # polishNote — returns title, emoji, polished, summary, actionItems, keyDecisions, tags
    payfast.ts              # generateSignature, verifyItnSignature, buildApiHeaders, getPayFastUrl
    utils.ts                # cn(), formatDuration()
    __tests__/payfast.test.ts
    __tests__/claude.test.ts
  middleware.ts             # Route protection (edge-safe, imports only auth.config.ts)
  test/setup.ts             # Vitest + jsdom setup
  types/next-auth.d.ts      # Session type augmentation (id, plan: trial/free/pro, trialEndsAt)

drizzle.config.ts
CLAUDE.md
```

---

## Database Schema (5 tables + 2 Auth.js)

| Table | Purpose |
|---|---|
| `users` | id, name, email, password_hash, plan ('free'/'trial'/'pro'), trial_started_at, trial_ends_at, daily_ask_count, last_ask_date, created_at |
| `notes` | id, user_id, title, emoji, raw_transcript, polished_transcript, summary, action_items (jsonb), key_decisions (jsonb), tags (text[]), duration, is_favorite, viewed, created_at, updated_at |
| `collection_summaries` | tag, user_id (PK: user_id, tag), summary, generated_at — cached AI summaries for smart collections |
| `subscriptions` | id, user_id, payfast_token, status, cancel_at_period_end, current_period_start/end, timestamps |
| `payments` | id, user_id, subscription_id, amount_cents, payfast_payment_id (unique), status, created_at |
| `accounts` | Auth.js OAuth provider links |
| `verification_tokens` | Auth.js email verification |

Indexes: `notes(user_id, created_at)`, `notes_fts_idx` (GIN on title+transcript), `notes_tags_idx` (GIN on tags).

---

## Business Model (V2)

- **Trial (7 days):** 20 notes, full features, card required upfront. Auto-charges R149 on day 8.
- **Free (post-trial fallback):** 3 notes/month, 5 asks/day, read-only insights on existing notes
- **Pro:** Unlimited notes, unlimited Ask, full features, R149/month via PayFast
- Plan values: `'trial'` | `'free'` | `'pro'` — enforced in `saveNote` by reading DB, not JWT
- PayFast sends ITN (Instant Transaction Notification) to `/api/payfast/notify`
- On `COMPLETE`: upsert subscription, set `users.plan = 'pro'` (atomic via `poolDb` transaction) — idempotent via `payfastPaymentId UNIQUE`
- On `CANCELLED`: set subscription cancelled, downgrade plan only if `currentPeriodEnd <= now()`
- On `FAILED`: insert failed payment record, no plan change
- `PENDING`: no-op

---

## Running the Project

```bash
npm run dev          # Development server
npm run build        # Production build
npm test             # Run tests (25 tests, 7 files — all passing)
npm run test:watch   # Watch mode
npm run lint         # ESLint
npm run db:push      # Push schema to Neon (requires DATABASE_URL in .env.local)
npm run db:generate  # Generate migration SQL
npm run db:migrate   # Run migrations
```

---

## Environment Setup (before first run)

1. **Neon Postgres** ✅ — project `cosmos` provisioned at https://console.neon.tech, AWS US East 1, Postgres 17. Project ID: `wandering-poetry-42994371`. All 6 tables created via Neon MCP (drizzle-kit push fails due to WebSocket timeout on Windows — use Neon MCP `run_sql` or the SQL Editor in the dashboard instead).
2. **Anthropic API key** — from https://console.anthropic.com
3. **PayFast sandbox** — register at https://sandbox.payfast.co.za
4. **Auth secret** ✅ — generated and set in `.env.local`

```bash
cp .env.example .env.local
# Fill in all values — DATABASE_URL from Neon dashboard, AUTH_SECRET, ANTHROPIC_API_KEY, PAYFAST_* etc.
npm run dev
```

### Neon connection string format
```
postgresql://neondb_owner:PASSWORD@ep-xxx-yyy-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
Get it from: Neon dashboard → your project → **Connect** button → copy the pooler connection string.

### Known issue: `drizzle-kit push` on Windows
`drizzle-kit push` uses `@neondatabase/serverless` WebSocket driver which times out on Windows/WSL. Workaround: run schema DDL directly via Neon MCP (`run_sql`) or the Neon SQL Editor in the dashboard.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Set `true` on Netlify only (behind reverse proxy) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `PAYFAST_MERCHANT_ID` | PayFast merchant ID |
| `PAYFAST_MERCHANT_KEY` | PayFast merchant key |
| `PAYFAST_PASSPHRASE` | ITN signature verification |
| `PAYFAST_SANDBOX` | `true` in dev, `false` in production |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` in dev |

---

## Implementation Status — V1 COMPLETE ✅ / V2 IN PROGRESS

### V1 — Complete
All 25 tasks implemented, 25 tests passing, production build verified.

**What's built:**
- Full auth flow (register, login, JWT sessions, route protection)
- Notes CRUD (create via voice, view, delete) with DB-authoritative free-tier limit
- Web Speech API recording with AudioContext waveform visualization
- Claude claude-sonnet-4-6 transcript polishing + title generation (with JSON fallback)
- Deep Space UI (violet/purple glow, StarField background, pulsing RecordingOrb)
- PayFast freemium subscription (R99/month Pro, ITN webhook, cancel flow)
- Pricing page, Account page with subscription management

**What's done:**
- Neon database provisioned, all 6 tables + index created
- `.env.local` configured with real DATABASE_URL, AUTH_SECRET, and ANTHROPIC_API_KEY
- App running locally, registration and login verified working

### Bug Fixes (2026-03-17 QA Session)

1. **`loginAction` swallowed redirect error** — `src/lib/actions/auth.ts:46`: The `catch` block caught Next.js's `NEXT_REDIRECT` error on successful login, causing "Invalid email or password" even with correct credentials. Fix: re-throw errors with `digest` starting with `NEXT_REDIRECT`.

2. **Intermittent Neon cold-start failures** — `src/app/record/page.tsx`: The Neon HTTP driver occasionally fails on first query after idle. Fix: added retry logic (`getUserPlan` with 2 retries) to the record page's pre-flight plan check.

3. **RecordingOrb animation conflict** — `src/components/RecordingOrb.tsx`: Removed `transition-transform hover:scale-105 active:scale-95` Tailwind classes that conflicted with the CSS `orb-idle` animation transform, making the button unresponsive to clicks.

4. **Neon cold-start failures across all pages** — Added `withRetry()` utility in `src/lib/utils.ts` (2 retries by default) and wrapped all Neon DB queries in server pages (`page.tsx`, `account/page.tsx`, `pricing/page.tsx`) and `checkAndExpireTrial`. Navbar catches errors silently to avoid crashing the page. Register action has inline retry for duplicate-email check.

5. **RecordingOrb stuck in "thinking" state on saveNote error** — `src/components/RecordingScreen.tsx`: After a `saveNote` failure, the orb stayed in "thinking" state with no way to retry. Fix: call `reset()` from `useRecorder` to return orb to idle on error. Also handles empty transcripts — if the user stops recording with no speech captured, shows an error message and resets instead of sending an empty transcript to Claude.

### Bug Fixes (2026-03-18 QA Session)

6. **Raw SQL errors leaking to users** — `saveNote` in `src/lib/actions/notes.ts`: DB insert errors exposed full SQL queries to the user. Fix: wrapped plan-check query and DB insert in separate try/catch blocks with clean user-facing error messages. Also wrapped `polishNote` call — if Claude API fails, note saves with fallback data (title: "Voice Note") instead of crashing.

7. **Neon cold-start retry had no delay** — `withRetry()` in `src/lib/utils.ts`: Retries fired instantly (0ms), hitting the same sleeping Neon compute. Fix: added exponential backoff (1s → 2s → 4s), increased retries from 2 to 3.

8. **Speech Recognition dying on long recordings** — `src/hooks/useRecorder.ts`: "Recognition error: network" crashed recording. Fix: auto-restart recognition on `network`/`aborted` errors (300ms delay). Added `onend` handler that auto-restarts if still in recording state (browser kills recognition after ~60s silence). Added `stateRef` for synchronous state access in callbacks.

9. **Error message sanitizer** — `src/components/RecordingScreen.tsx`: Added safety check that detects SQL keywords in error messages and replaces with clean "Failed to save note" message.

10. **`keyDecisions` crash: "Objects are not valid as React child"** — `src/components/InsightsView.tsx`: Claude returns `keyDecisions` as `[{text: "..."}]` (objects) but component expected `string[]`. Fix: normalize `keyDecisions` — extract `.text` from objects, pass through strings.

11. **Ask Your Notes 500 errors (both routes)** — `src/app/api/ask/[noteId]/route.ts` and `src/app/api/ask/route.ts`: All DB queries had no retry for Neon cold starts. Fix: wrapped all 7 DB queries across both routes with `withRetry()`.

12. **Note detail page crash on cold start** — `src/app/notes/[id]/page.tsx`: DB query to fetch note had no retry. Fix: wrapped with `withRetry()`.

13. **`repolishNote` server action** — `src/lib/actions/notes.ts`: Added action to re-process existing notes through Claude. Used by "Generate AI Insights" / "Regenerate insights" buttons in InsightsView.

14. **`renameNote` server action** — `src/lib/actions/notes.ts`: Added action to rename notes with validation (1-200 chars) and retry.

15. **Privacy Policy & Terms of Use** — `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`: Full legal pages covering POPIA compliance, AI disclaimer, no audio storage, PayFast billing, data rights. Linked from Settings → About.

### V2 — Upgrade (In Progress)

**Vision**: Transform Cosmos from a voice recorder into an intelligent personal knowledge base. *"Summary takes notes. Cosmos thinks for you."*

**Differentiators vs Summary AI Note Taker:**
- **Ask Your Notes** — cross-note AI chat that searches entire history (Summary only does per-note chat)
- **AI Auto-Tags + Smart Collections** — automatic organization via Claude-generated tags, no manual folders

**V2 features implemented:**
- ✅ AI Insights per note (summary, action items, key decisions, emoji, tags)
- ✅ Ask Your Notes — per-note AI chat with SSE streaming
- ✅ Ask Your Notes — global cross-note AI chat with full-text search + citations
- ✅ AI Auto-Tags + Smart Collections (tag pills, collections tab)
- ✅ Richer NoteCards (emoji, time, duration, unread dot, ••• menu)
- ✅ Note detail tabbed view (Summary | Transcript | Ask)
- ✅ Category tabs (All, Meetings, Favorites, Collections)
- ✅ Favorites system (toggle, filter)
- ✅ Share/Copy/Print/Export buttons
- ✅ Full-width "New Note" CTA
- ✅ Language rename: "recording" → "note"
- ✅ Re-polish/regenerate insights for existing notes
- ✅ Note rename (inline edit)
- ✅ Settings page with theme toggle, transcript settings
- ✅ Privacy Policy & Terms of Use pages
- ✅ Cloud (light) theme + Deep Space (dark) theme

**V2 Spec**: `docs/superpowers/specs/2026-03-17-cosmos-v2-upgrade-design.md`

### Next steps
1. Set up PayFast sandbox credentials
2. Test PayFast sandbox end-to-end (ngrok for ITN delivery)
3. Deploy to Netlify
4. Consider Neon paid plan ($19/mo) for "Always On" compute (eliminates cold starts)

---

## Spec & Plan

- **V1 Spec:** `c:/dev/my-legacy-memories/docs/superpowers/specs/2026-03-17-cosmos-ai-note-taker-design.md`
- **V1 Plan:** `c:/dev/my-legacy-memories/docs/superpowers/plans/2026-03-17-cosmos-ai-note-taker.md`
- **V2 Spec:** `docs/superpowers/specs/2026-03-17-cosmos-v2-upgrade-design.md`
