@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal food/coffee recommendation web app for Taipei. Stores restaurants and cafés the user curates; Claude Haiku picks up to 3 based on MRT station, tags, and a free-text craving. Mobile-first, used one-handed by friends of the creator while standing outside hungry.

Live: <https://food-picker.sean22492249.workers.dev>

## Commands

```bash
npm run dev              # local dev (webpack, NOT turbopack)
npm run build            # generate-releases → next build --webpack
npm run lint             # eslint
npx tsc --noEmit         # type check — the project's correctness gate (no test framework)
npm run cf:preview       # opennextjs-cloudflare build + wrangler dev
npm run cf:deploy        # opennextjs-cloudflare build + wrangler deploy
bash scripts/deploy.sh   # same as cf:deploy with logging
```

There is no test framework. `npx tsc --noEmit` is the only automated correctness check — run it before claiming work done. Lint is also non-negotiable since `eslint-config-next` catches App Router footguns.

## Critical build constraint

**Never remove `--webpack` from the build/dev scripts.** Next.js 16's default is Turbopack, but `@opennextjs/cloudflare` cannot consume Turbopack's SSR chunk format and the deploy will silently produce a broken Worker. Both `dev` and `build` pin webpack explicitly.

## Tech stack

- **Next.js 16.2.4** App Router + **React 19** — see `AGENTS.md`; this version has breaking changes, consult `node_modules/next/dist/docs/` before writing route code.
- **Supabase** PostgreSQL via `@supabase/supabase-js`.
- **Anthropic SDK** `@anthropic-ai/sdk`, model `claude-haiku-4-5-20251001` (extended thinking enabled in recommendation calls).
- **Tailwind CSS v4** + **shadcn/ui** (`components/ui/`).
- **Cloudflare Workers** via `@opennextjs/cloudflare` (open-next adapter).

## Environment variables

| Variable | Scope |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client (read-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | **API routes only**, via `createServiceClient()` |
| `ANTHROPIC_API_KEY` | API routes only |

`SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must never reach the client. Local dev reads from `.env.local`; production deploys via `.github/workflows/deploy.yml` inject all four into the build environment from GitHub Actions secrets (`NEXT_PUBLIC_*` get inlined into the bundle by Next.js at build time, so they don't need a `[vars]` block in `wrangler.toml`). `.env.local.example` also lists `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_URL` but no Telegram routes currently exist in the codebase — treat those as dormant.

### Cloudflare deploy prerequisites

The deploy workflow needs two more GitHub Actions secrets:

| Secret | Notes |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Create via the dashboard preset **"Edit Cloudflare Workers"** — not a hand-rolled token with only `Workers Scripts: Edit`. The asset-upload-session endpoint requires the full preset's scopes (Workers Scripts/Routes/KV/R2, Account Settings, User Details, Memberships). |
| `CLOUDFLARE_ACCOUNT_ID` | The account that owns the `food-picker` Worker. |

If deploy fails with `entitlements.not_available [code: 10007]` on the `assets-upload-session` call, the cause is one of: token missing scopes, account hasn't accepted the current Workers TOS in the dashboard, or wrong `CLOUDFLARE_ACCOUNT_ID`. The "Cloudflare auth diagnostics" step in `deploy.yml` runs `wrangler whoami` before deploy — check its output (token permissions and account list) in the failed Actions run first.

## Architecture — things that need >1 file to understand

### Single table, two entities (`entity_type` discriminator)
Restaurants and cafés share the **same `restaurants` Postgres table**, discriminated by an `entity_type` column (`'restaurant' | 'cafe'`). The UI is duplicated under `/restaurants/*` and `/cafes/*`, but both routes resolve copy, AI prompts, paths, and tone through `ENTITY_CONFIG` in `lib/entity-config.ts`. When adding a feature, extend `ENTITY_CONFIG` (or pass `entityType` to a shared component) rather than forking the two route trees. `PATCH /api/restaurants/[id]` explicitly rejects changing `entity_type` — a row cannot migrate between sections.

### Recommendation flow
`POST /api/recommend` (`app/api/recommend/route.ts`) filters in JS (`visited_filter`, `tags`, `mrt_line`, `mrt_station`) and hands the pre-filtered list to `getRecommendation()` in `lib/recommendation.ts`. That function:
- Renders one line per candidate with name, `ai_summary`, tags, review, items, MRT line/station, rating, visited state.
- Calls Claude Haiku with extended thinking (`budget_tokens: 1024`) and a two-block system prompt: the static persona text + the **dynamic restaurant list flagged `cache_control: ephemeral`**. The persona differs per `entity_type`, so each entity type maintains its own prompt cache.
- Asks for JSON `{indices, messages, reasoning}` and parses with a tolerant `/\{[\s\S]*\}/` regex — Haiku sometimes wraps the JSON in prose, so plain `JSON.parse` of the whole response will break.

The user can "reroll" — the client passes already-shown IDs in `exclude_ids` and the same filtered set is re-asked.

### AI summary lifecycle
`ai_summary` is a one-sentence Claude-generated description stored on each row (`lib/ai-summary.ts`). It is **regenerated only when meaningful fields change**: `review`, `visited`, `tags`, or `items` (arrays compared via `areStringArraysEqual`). The PATCH route strips `ai_summary` and `entity_type` from incoming bodies — both are managed server-side. Summary generation is best-effort: if the Anthropic call throws, the underlying create/update still succeeds and the error is logged. POST also runs an inline summary after insert.

### MRT data — stations are canonical, lines are derived
`lib/mrt-stations.ts` defines the 6 Taipei Metro lines and their stations as static arrays, then builds a reverse `LINES_BY_STATION` map at module load. A single station name (e.g. 忠孝復興, 中正紀念堂) can belong to multiple lines, so use `getLinesForStation(station)` instead of assuming station→line is 1:1. The DB stores only `mrt_station` (string); line membership is computed every render/request.

### Release notes are generated at build time
`scripts/generate-releases.mjs` runs as part of `npm run build` (chained before `next build`). It reads every `docs/releases/*.md`, sorts filenames descending, and emits `lib/releases.generated.ts` (a TS module exporting `{filename, content}[]`). The home page imports this and parses titles/dates/sections on render. To add a release entry, drop a new dated markdown file in `docs/releases/` — do not edit `releases.generated.ts` by hand, it's regenerated and overwritten.

### Next.js 16 route param convention
Dynamic route handlers must type `params` as `Promise<{ id: string }>` and `await` it — a Next.js 16 breaking change, enforced throughout `app/api/restaurants/[id]/route.ts`. New dynamic routes must follow the same shape or builds fail.

### Supabase client split
Two clients in `lib/supabase.ts`:
- `supabase` (anon key, exported singleton) — for browser code.
- `createServiceClient()` (service role, called per-request) — for API routes only.

API routes consistently use the service client. Never import the anon client into a route handler.

### Markdown imports via webpack
`next.config.ts` adds a webpack rule treating `*.md` as `asset/source`, plus `types/markdown.d.ts` declares the module shape. This lets server components and scripts import markdown directly as strings. If you add a non-webpack build path, this rule needs to be ported.

## Database

Authoritative schema: `supabase/schema.sql`. Deltas since the initial schema live in `supabase/migrations/` and must be applied in filename order via the Supabase Dashboard SQL Editor — there is no local Supabase tooling configured in this repo.

Tables in current use:
- `restaurants` — name, `mrt_station`, `items[]`, `visited`, `visit_date`, `rating` (1–5), `review`, `tags[]`, `ai_summary`, `entity_type`, timestamps.
- `recommendation_logs` — `chosen_restaurant_id`, `shown_restaurant_ids[]`, `entity_type`, written by `/api/recommend/feedback`.

Historical state still in `schema.sql` but inactive:
- `mood_logs` — the mood feature was removed; the table is read-only history, do not write to it.
- `telegram_sessions` — no Telegram bot routes exist in the current codebase.

## Conventions worth following

- API routes return `NextResponse.json({ error: string }, { status })` on failure with a sensible HTTP code (400/404/500). Match the existing style.
- Validation is light and intentional — `name` required, `entity_type` normalized via `normalizeEntityType()`, otherwise trust the client schema and let Supabase reject malformed rows.
- All user-facing copy and AI prompts are **Traditional Chinese (繁體中文)**. Match the tone in `ENTITY_CONFIG` — LINE-message casual, never customer-service phrasing like 「以下」「為您推薦」.
- `app/layout.tsx` caps content at `max-w-2xl mx-auto` and renders `<NavBar />` globally. New pages slot into this; don't introduce a competing width container.
- `@/*` path alias resolves to the repo root (see `tsconfig.json`).

## Design context

### Users
Friends of the creator, primarily on mobile. The moment of use: standing somewhere, hungry, reaching for the phone for a quick suggestion. The context is casual, personal, social — a comfort tool, not a productivity tool.

### Brand personality
**Three words: handmade, healing, local (療癒).** The app should feel like a warm notebook a friend keeps of their favourite spots, not a polished SaaS product. Texture and life-like imperfection are welcome.

### Aesthetic rules
- Light mode only — warm, off-white surfaces (aged paper / used recipe card), never pure white.
- Palette leans amber/orange. Primary CTA accent is `#E46C0A` (already in the theme). No cool grays, no pure blacks, no achromatic neutrals.
- No tech/SaaS feel — no blue system colors, no sharp dashboard grids, must not resemble Uber Eats / Foodpanda.
- Iconography is contextual and playful (footprint for walking, bus for transit). Hand-drawn linework over filled shapes.
- Mobile-first, thumb-friendly. Large tap targets, generous spacing, no tiny controls.

### Principles
1. **Comfort over efficiency** — every interaction is warm and unhurried.
2. **Texture over polish** — imperfect, handmade visual qualities create the lived-in feel.
3. **Warmth is a palette rule** — every color leans warm; tint everything toward amber.
4. **Playfulness through detail** — small touches (icons, button phrasing, micro-animations) carry the personality.
