@AGENTS.md

# Food Picker — Project Context

## What This Is
Personal food recommendation web app. User stores restaurants, and Claude (Haiku) recommends up to 3 based on proximity score and tags. User can record which they chose.

## Tech Stack
- **Next.js 16.2.4** (App Router, React 19) — see AGENTS.md for breaking changes
- **Supabase** — PostgreSQL via `@supabase/supabase-js`
- **Anthropic SDK** `@anthropic-ai/sdk` — Claude Haiku for recommendations and tag generation
- **Tailwind CSS v4** + shadcn/ui components (in `components/ui/`)
- **Cloudflare Workers** — production deployment target

## Critical Build Constraint
**Always use `npm run build`**, never `next build` directly.  
The build script is `next build --webpack` — Turbopack (Next.js 16 default) breaks `@opennextjs/cloudflare`. Never remove `--webpack`.

## Deployment
- **Live URL:** `food-picker.sean22492249.workers.dev`
- Deploy: `npm run cf:deploy` (builds with opennextjs-cloudflare then runs wrangler)
- Secrets set on Workers via `wrangler secret put`

## Environment Variables
| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client (read-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes only (via `createServiceClient()`) |
| `ANTHROPIC_API_KEY` | API routes only |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## Database Schema (Supabase)

```sql
restaurants (
  id uuid PK,
  name text NOT NULL,
  mrt_station text,
  items text[],          -- specific dishes
  visited boolean,
  visit_date timestamptz,
  rating smallint,       -- 1-5
  review text,
  proximity smallint,    -- 1-10 (1=far, 10=very close)
  tags text[],           -- AI-generated from review
  created_at, updated_at timestamptz
)

recommendation_logs (
  id uuid PK,
  chosen_restaurant_id uuid → restaurants,
  shown_restaurant_ids uuid[],
  created_at timestamptz
)

```

Migration history in `supabase/migrations/`. Run new migrations via Supabase Dashboard → SQL Editor.

## File Structure
```
app/
  page.tsx                         # Home
  layout.tsx                       # Nav + global layout (max-w-2xl)
  recommend/page.tsx               # Recommendation UI (item input → ≤3 results + choose)
  restaurants/page.tsx             # Restaurant list
  restaurants/new/page.tsx         # Add restaurant form
  api/
    recommend/route.ts             # POST → getRecommendation()
    recommend/feedback/route.ts    # POST → record chosen restaurant
    restaurants/route.ts           # GET list / POST create
    restaurants/[id]/route.ts      # GET / PATCH / DELETE
    restaurants/generate-tags/route.ts  # POST → Claude generates tags from review
components/
  RestaurantCard.tsx               # Shows name, proximity, rating, items, tags, choose/delete
  RestaurantForm.tsx               # Create form with proximity selector + tag generation
  ui/                              # shadcn components (button, card, badge, input, etc.)
lib/
  recommendation.ts                # Core AI logic — getRecommendation(item?, excludeIds?)
  supabase.ts                      # supabase (anon client) + createServiceClient() (server)
  utils.ts                         # cn() helper
types/index.ts                     # Restaurant, RecommendRequest/Response, FeedbackRequest
supabase/
  schema.sql                       # Full schema (authoritative)
  migrations/                      # Delta SQLs applied in order
```

## Key Conventions
- **API routes** use `createServiceClient()` (service role key), never the anon client
- **Route params** must be `Promise<{ id: string }>` and awaited — Next.js 16 breaking change
- **Recommendation engine** (`lib/recommendation.ts`): static restaurant list uses `cache_control: ephemeral` for Anthropic prompt caching
- **No test framework** — use `npx tsc --noEmit` to gate correctness
- **No mood feature** — removed; `mood_logs` table exists in DB for history but is no longer written to

