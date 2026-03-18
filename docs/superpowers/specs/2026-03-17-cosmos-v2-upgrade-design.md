# Cosmos V2 — AI Note Taker Upgrade

## Vision

Transform Cosmos from a voice recorder with AI polishing into an **intelligent personal knowledge base**. The tagline: *"Summary takes notes. Cosmos thinks for you."*

Two killer differentiators vs Summary AI Note Taker:
1. **Ask Your Notes** — cross-note AI chat that searches your entire history
2. **AI Auto-Tags + Smart Collections** — automatic organization, no manual folders needed

---

## Business Model: 7-Day Trial + Freemium Fallback

### Pricing Structure

| | Trial (7 days) | Free (post-trial) | Pro |
|---|---|---|---|
| **Price** | R0 (card required upfront) | R0 | **R149/month** |
| **Notes** | 20 total | 3/month | Unlimited |
| **AI Insights** | Full | Read-only on existing notes | Full |
| **Ask Your Notes** | Unlimited | 5/day | Unlimited |
| **Smart Collections** | Full | View only (no new summaries) | Full |
| **Favorites & Search** | Full | Full | Full |

### User Journey

1. **Sign up** → enter card details → 7-day trial starts (`plan = 'trial'`)
2. **Day 1-7**: Full access to all features, 20 note limit
3. **Day 7**: Reminder notification (in-app)
4. **Day 8**: PayFast auto-charges R149. If payment succeeds → `plan = 'pro'`
5. **Payment fails / cancelled**: 2-day grace period, then `plan = 'free'`
6. **Free fallback**: User keeps all notes, gets 3 notes/month + 5 asks/day

**Skip trial option**: If user skips card capture at signup → `plan = 'free'` immediately (no trial).

### Database Changes for Trial

```sql
ALTER TABLE users ADD COLUMN trial_started_at timestamptz;
ALTER TABLE users ADD COLUMN trial_ends_at timestamptz;
-- plan values: 'trial' | 'free' | 'pro'
```

### Limit Enforcement

- **Trial**: Count total notes since `trial_started_at`. Limit: 20.
- **Free**: Count notes this month. Limit: 3.
- **Pro**: No limit.
- **Ask rate limits**: Free = 5/day, Trial/Pro = unlimited.

### Trial Expiry

Check on each authenticated request (middleware or page load):
- If `plan = 'trial'` AND `trial_ends_at < now()`:
  - If active PayFast subscription exists → set `plan = 'pro'`
  - Otherwise → set `plan = 'free'`

---

## Feature Set (Priority Order)

### P0 — Differentiators (what makes Cosmos win)

#### 1. AI Insights per Note
Extend Claude's polishing step to extract structured insights from each transcript.

**What Claude returns (JSON):**
```json
{
  "title": "S4HANA Go-Live Recap",
  "emoji": "🐯",
  "polished": "...",
  "summary": "2-3 sentence overview",
  "actionItems": [
    { "text": "Schedule follow-up demo with finance team", "assignee": "Zama" }
  ],
  "keyDecisions": [
    "Migrate all group entities to SAP HANA platform by Q2"
  ],
  "tags": ["s4hana", "go-live", "migration"]
}
```

**Zod validation schemas** (used at both write and read time):
```ts
const ActionItemSchema = z.object({ text: z.string(), assignee: z.string().optional() })
const InsightsSchema = z.object({
  title: z.string(),
  emoji: z.string(),
  polished: z.string(),
  summary: z.string(),
  actionItems: z.array(ActionItemSchema),
  keyDecisions: z.array(z.string()),
  tags: z.array(z.string()),
})
```

**Storage**: New columns on `notes` table: `emoji`, `summary`, `action_items` (jsonb), `key_decisions` (jsonb), `tags` (text array), `updated_at`.

**Fallback**: If Claude's JSON parsing or Zod validation fails, fall back to current behavior (title + polished transcript only, empty insights).

**`max_tokens`**: Increase from 4096 to **8192** in the Claude API call to accommodate the expanded response (polished transcript + all insights).

#### 2. Ask Your Notes — Cross-Note AI Chat
A chat interface where users ask questions across their **entire note history**.

**How it works:**
1. User types a question (e.g., "What did I decide about pricing?")
2. Server searches notes using Postgres full-text search (`to_tsvector`/`to_tsquery`) + tag matching
3. Top 5-10 matching notes (polished transcripts, truncated) are passed as context to Claude
4. Claude answers with **citations** linking back to specific notes: "In your note 'Pricing Discussion' from March 12..."
5. Response streams back via SSE using `client.messages.stream()`

**UI**: An "Ask" tab on the home page (alongside All, Meetings, Favorites, Collections). Opens a chat-like interface with a text input and streaming response area.

**Two variants:**

| Variant | Route | Context | Purpose |
|---------|-------|---------|---------|
| **Global Ask** | `POST /api/ask` | Searches across ALL user's notes | "What action items do I have this week?" |
| **Note Ask** | `POST /api/ask/[noteId]` | Single note's full transcript | "Summarize the key points from this meeting" |

Both are **API routes** (not Server Actions) because they return SSE streams. Server Actions cannot return streaming responses.

**Global Ask request:** `{ question: string }`
**Note Ask request:** `{ question: string }` (noteId from URL param)

**Keyword extraction for tag matching:** Use `plainto_tsquery` to tokenize the question into words, then strip common English stop words. Match remaining tokens against the `tags` array. No Claude pre-processing needed — Postgres handles the tokenization.

**Rate limiting:** Free users: 5 questions/day. Pro users: unlimited. Enforced server-side by counting Ask requests per user per day (query `askCount` from a simple counter, or use a rate-limit column on `users`).

**No vector embeddings needed** for V2 — Postgres full-text search + tag matching is sufficient. Can upgrade to pgvector later if needed.

#### 3. AI Auto-Tags + Smart Collections
Claude generates tags for each note during polishing. The system groups notes with shared tags into automatic collections.

**Tags:**
- Generated by Claude during polishing (included in the JSON response above)
- Stored as `text[]` on the `notes` table
- Displayed as pills on NoteCard and NoteDetail
- Tappable — filter feed by tag

**Smart Collections:**
- Auto-generated when 3+ notes share a tag
- Displayed in a "Collections" tab (replaces "Folders" from reference app)
- Example: If 4 notes are tagged `#s4hana`, a "S4HANA" collection appears automatically
- Collection view shows all related notes + an AI-generated collection summary
- No DB table needed — collections are computed from tags at query time

**Collection summary:**
- Generated via `POST /api/collections/[tag]/summary` API route
- Sends top 5 notes' summaries (not full transcripts) to Claude with prompt: "Summarize the common themes across these notes about [tag]"
- **Cached**: Store in a `collection_summaries` table (`tag text PK, user_id uuid, summary text, generated_at timestamptz`). Invalidate when a new note with that tag is created (check `generated_at` vs latest note's `created_at`)
- This avoids a Claude call on every collection view

---

### P1 — Feature Parity (catch up to Summary)

#### 4. Richer NoteCards
Current: title + relative date. Upgraded:

- **Emoji** — AI-generated, displayed in a rounded square (48x48)
- **Title** — Space Grotesk, truncated with ellipsis
- **Time + Duration** — "2:38 PM  26:02" format (use `date-fns` `format(date, 'h:mm a')` + `formatDuration`)
- **Unread dot** — violet dot for notes not yet viewed (new `viewed` boolean on `notes`, default `false`)
- **Three-dot menu** — Favorite, Delete, Copy Summary (bottom sheet on mobile)
- **Favorite star** — inline on favorited notes

#### 5. Note Detail — Tabbed View
Replace current single-view NoteDetail with three tabs:

- **Summary** — AI summary, action items (with checkboxes), key decisions, tags
- **Transcript** — Full polished transcript (current view)
- **Ask** — Chat with THIS specific note via `POST /api/ask/[noteId]` (single-note context, unlike the global Ask)

Header: back arrow, emoji, favorite heart, copy button, ••• menu.

#### 6. Category Tabs on Feed
Horizontal scrollable tabs above the search bar:

- **All** — all notes, sorted by recency
- **Meetings** — notes where `tags` overlap with meeting keywords: `['meeting', 'meetings', 'standup', 'sync', '1-on-1', 'one-on-one', 'catch-up', 'review', 'retro', 'retrospective', 'kickoff', 'check-in']`. Matched via `tags && ARRAY[...meeting_keywords]::text[]` (Postgres array overlap operator).
- **Favorites** — notes where `is_favorite = true`
- **Collections** — AI-generated smart collections (replaces "Folders")

#### 7. Favorites
- New `is_favorite` boolean column on `notes` table (default false)
- Toggle via heart icon on NoteDetail header or ••• menu on NoteCard
- Server action: `toggleFavorite(noteId)` — ownership check required
- Favorites tab filters `WHERE is_favorite = true`

---

### P2 — Polish & Extras

#### 8. Copy Summary
- Copies AI summary + action items as **Markdown-formatted text** to clipboard
- Example output:
  ```
  ## S4HANA Go-Live Recap

  All group entities now on SAP HANA platform. Final vector rolled in Tanzania (Jan 2026).

  ### Action Items
  - [ ] Schedule follow-up demo with finance team (@Zama)
  - [ ] Prepare migration report for Q2 review

  ### Key Decisions
  - Migrate all group entities to SAP HANA platform by Q2
  ```
- Uses `navigator.clipboard.writeText()` with a toast confirmation

#### 9. "New Note" CTA
Replace the small circular FAB with a full-width bottom button:
- Gradient violet background matching the Deep Space theme
- Mic icon + "New Note" text
- Fixed to bottom of screen, 16px margin

#### 10. Language Rename
Replace all instances of "recording" with "note" throughout the UI:
- "New Recording" → "New Note"
- "Nothing recorded yet" → "No notes yet. Tap to create one."
- "Start recording" → "Start note"
- "Stop recording" → "Save note"
- "10 recordings / month" → "10 notes / month"
- "0/10 recordings used" → "0/10 notes used"
- `getMonthlyRecordingCount` → `getMonthlyNoteCount`

---

## Database Changes

### Modified: `notes` table
```sql
ALTER TABLE notes ADD COLUMN emoji text DEFAULT '📝';
ALTER TABLE notes ADD COLUMN summary text;
ALTER TABLE notes ADD COLUMN action_items jsonb DEFAULT '[]';
ALTER TABLE notes ADD COLUMN key_decisions jsonb DEFAULT '[]';
ALTER TABLE notes ADD COLUMN tags text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN is_favorite boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN viewed boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN updated_at timestamptz DEFAULT now();
```

Note: `viewed` defaults to `false` so new notes show the unread violet dot. The dot clears when the user opens the note detail page.

### New table: `collection_summaries`
```sql
CREATE TABLE collection_summaries (
  tag text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (tag, user_id)
);
```

### New index for full-text search
```sql
CREATE INDEX notes_fts_idx ON notes
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(polished_transcript, '')));
```

### New index for tags
```sql
CREATE INDEX notes_tags_idx ON notes USING gin(tags);
```

**Migration strategy**: Since `drizzle-kit push` fails on Windows due to WebSocket timeouts (documented in CLAUDE.md), all schema changes will be applied via **Neon MCP `run_sql`** or the Neon SQL Editor in the dashboard. The Drizzle schema files (`src/lib/db/schema/notes.ts`) will be updated to match, but the DDL runs directly against Neon.

---

## Claude Prompt Changes

### Updated polishing prompt
The existing `polishNote` function in `src/lib/claude.ts` will be updated:

- **`max_tokens`**: 4096 → **8192**
- **Prompt**: Request structured JSON with insights (title, emoji, polished, summary, actionItems, keyDecisions, tags)
- **Validation**: Parse response with `InsightsSchema` (Zod). On validation failure, fall back to extracting just `title` and `polished` if possible, otherwise use current fallback (`{ title: 'Voice Note', polished: rawTranscript }`).
- **Model**: Remains `claude-sonnet-4-6`

**Backward compatibility**: Existing notes without insights will display the polished transcript only. The Summary tab gracefully handles null/empty insights fields.

---

## API Routes

### `POST /api/ask` — Global Ask
Cross-note AI chat endpoint. **This is an API route, NOT a Server Action** (streaming requires SSE).

**Request:** `{ question: string }`

**Flow:**
1. Authenticate user via `auth()` (401 if no session)
2. Rate limit check: count today's asks for this user. Free: 20/day max. Pro: unlimited.
3. Search notes via full-text search: `to_tsvector('english', title || polished_transcript) @@ plainto_tsquery('english', question)`
4. Also match by tags: extract tokens from question via `plainto_tsquery`, match against `tags` array with overlap operator
5. Take top 10 matching notes (by relevance rank), truncate each polished_transcript to ~2000 chars
6. Build Claude prompt with note contexts + user question
7. Stream response via SSE using `client.messages.stream()` from `@anthropic-ai/sdk`

**Response:** SSE stream with text chunks. Citations formatted as `[Note: "Title" (date)](/notes/{id})`.

### `POST /api/ask/[noteId]` — Note-Level Ask
Single-note chat endpoint.

**Request:** `{ question: string }`

**Flow:**
1. Authenticate user, verify note ownership
2. Rate limit check (same limits as global)
3. Load the single note's full polished transcript + summary + action items
4. Build Claude prompt with note context + user question
5. Stream response via SSE

### `POST /api/collections/[tag]/summary` — Collection Summary
Generates or returns cached AI summary for a collection.

**Flow:**
1. Authenticate user
2. Check `collection_summaries` cache — if `generated_at` is after the latest note with this tag, return cached
3. Otherwise, load top 5 notes' summaries for this tag, send to Claude
4. Cache result in `collection_summaries`, return

---

## Component Changes

### New Components
- `NoteTabs` — horizontal scrollable category tabs (All, Meetings, Favorites, Collections)
- `NoteDetailTabs` — Summary | Transcript | Ask tabs for note detail page
- `InsightsView` — renders summary, action items (checkboxes), key decisions, tags
- `AskChat` — chat interface for Ask Your Notes (reused for both global and note-level)
- `TagPill` — small rounded tag display, tappable to filter
- `NoteMenu` — three-dot menu bottom sheet (Favorite, Delete, Copy Summary)
- `CollectionCard` — card for a smart collection (tag name, note count, cached summary preview)

### Modified Components
- `NoteCard` — add emoji, time, duration, unread dot, ••• menu, favorite star
- `NoteDetail` → refactored into tabbed view with InsightsView
- `NotesFeed` — add NoteTabs, support filtering by tab/tag
- `RecordingScreen` — rename labels to "note" language
- `RecordingOrb` — rename aria-labels
- `Navbar` — "recordings" → "notes" language
- `PricingCard` — "recordings" → "notes"
- `AccountView` — "recordings" → "notes"

### Server Actions (mutations only — no streaming)
- `saveNote` — update to store emoji, summary, action_items, key_decisions, tags from Claude response
- New: `toggleFavorite(noteId)` — flip is_favorite, set updated_at
- New: `markViewed(noteId)` — set `viewed = true` if not already (idempotent, fire-and-forget — do NOT await in the page render path; call via `startTransition` or `after()`)
- `getMonthlyRecordingCount` → rename to `getMonthlyNoteCount`

### API Routes (streaming — NOT Server Actions)
- `POST /api/ask` — global cross-note Ask
- `POST /api/ask/[noteId]` — single-note Ask
- `POST /api/collections/[tag]/summary` — collection summary generation

---

## UX Flow

### Creating a Note
1. User taps "New Note" button
2. Record page: tap orb → grant mic → speak → tap to stop
3. Orb enters "thinking" state while Claude processes
4. Claude returns title, emoji, polished transcript, summary, action items, key decisions, tags
5. Note saved to DB with `viewed: false`, user redirected to note detail (Summary tab)
6. `markViewed` fires (fire-and-forget) when note detail opens
7. Note appears in feed without unread dot (since user just viewed it)

### Asking Your Notes (Global)
1. User taps "Ask" tab in the feed
2. Chat interface appears with a text input
3. User types: "What action items do I have from this week?"
4. Streaming response appears with cited answers
5. Citations are clickable links to specific notes

### Asking a Single Note
1. User opens a note detail → taps "Ask" tab
2. Types: "What were the main takeaways?"
3. Claude answers using only this note's transcript as context

### Smart Collections
1. User taps "Collections" tab
2. Sees auto-generated collection cards: "S4HANA (4 notes)", "Pricing (3 notes)"
3. Taps a collection → sees all related notes + AI summary of the collection (cached)
4. No manual creation needed — collections appear/disappear as tags accumulate

---

## Out of Scope (V2)

- Audio recording/playback (Web Speech API does real-time transcription, no audio file stored)
- Speaker diarization (would require a real ASR service like Whisper)
- Export as DOCX/PDF
- Public shared note links
- Vector embeddings / pgvector (full-text search is sufficient for V2)
- Offline support
- Mobile app (PWA possible later)

---

## Success Criteria

1. All existing functionality continues working (auth, notes CRUD, subscription)
2. Claude returns structured insights for new notes (validated with Zod)
3. Users can browse notes by All/Meetings/Favorites/Collections tabs
4. Users can ask questions across their entire note history and get cited streaming answers
5. Users can ask questions about a single note from the note detail page
6. Notes auto-organize into smart collections via AI-generated tags
7. All UI references say "note" instead of "recording"
8. Ask endpoints are rate-limited (20/day free, unlimited pro)
9. All 25 existing tests still pass + new tests for insights, ask, and favorites
