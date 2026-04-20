# Food Picker Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove mood feature, add 1-10 proximity scoring, auto-generate tags from reviews, update recommendation engine to return up to 3 restaurants with proximity/tag weighting, and record user selection feedback.

**Architecture:** Schema migration adds `proximity` (1-10) and `tags` columns to `restaurants`, plus a `recommendation_logs` table for feedback. The recommendation engine drops mood entirely and gains multi-result support. A new `/api/restaurants/[id]/generate-tags` route calls Claude to extract tags from a review. The existing `mood_logs` table is left in place (historical data) but no longer written to.

**Tech Stack:** Next.js 16 (App Router, async params), Supabase, Anthropic SDK (`@anthropic-ai/sdk`), TypeScript, Tailwind CSS

> **Note:** No test framework is configured. Use `npx tsc --noEmit` as the correctness gate after each task. The project uses `next build --webpack` (not Turbopack) per the Cloudflare constraint.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/schema.sql` | Modify | Add proximity, tags, recommendation_logs; update constraints |
| `supabase/migrations/001_improvements.sql` | Create | Delta migration to run against existing DB |
| `types/index.ts` | Modify | Remove Mood/MoodLog, add proximity/tags, update recommend types |
| `lib/recommendation.ts` | Modify | Remove mood, add proximity+tags to prompt, return ≤3 restaurants |
| `app/api/recommend/route.ts` | Modify | Remove mood validation, handle multi-result response |
| `app/api/recommend/feedback/route.ts` | Create | Record user's restaurant selection |
| `app/api/restaurants/[id]/generate-tags/route.ts` | Create | Claude call to generate tags from review text |
| `app/api/restaurants/route.ts` | Modify | Include proximity and tags in insert |
| `app/recommend/page.tsx` | Modify | Remove MoodSelector, show ≤3 results, add selection UI |
| `components/MoodSelector.tsx` | Delete | No longer needed |
| `components/RestaurantCard.tsx` | Modify | Show proximity score and tags |
| `components/RestaurantForm.tsx` | Modify | Add proximity selector, trigger tag generation after review |

---

### Task 1: DB Migration — proximity, tags, recommendation_logs

**Files:**
- Create: `supabase/migrations/001_improvements.sql`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Create the migration SQL file**

```sql
-- supabase/migrations/001_improvements.sql

-- Add proximity score (1=far, 10=very close) to restaurants
alter table restaurants
  add column if not exists proximity smallint check (proximity between 1 and 10);

-- Add AI-generated tags
alter table restaurants
  add column if not exists tags text[] not null default '{}';

-- Record which restaurant the user actually chose from a recommendation set
create table if not exists recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  chosen_restaurant_id uuid references restaurants(id) on delete set null,
  shown_restaurant_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table recommendation_logs enable row level security;
drop policy if exists "Allow all" on recommendation_logs;
create policy "Allow all" on recommendation_logs
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Update schema.sql to reflect final state**

In `supabase/schema.sql`, add these columns to the `restaurants` table definition after `review text,`:

```sql
  proximity smallint check (proximity between 1 and 10),
  tags text[] not null default '{}',
```

And append the `recommendation_logs` table after the existing tables:

```sql
-- Recommendation feedback logs
create table if not exists recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  chosen_restaurant_id uuid references restaurants(id) on delete set null,
  shown_restaurant_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table recommendation_logs enable row level security;
drop policy if exists "Allow all" on recommendation_logs;
create policy "Allow all" on recommendation_logs
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 3: Run the migration in Supabase**

Go to Supabase Dashboard → SQL Editor, paste and run the contents of `supabase/migrations/001_improvements.sql`.

Expected: No errors. Columns visible in Table Editor under `restaurants`.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql supabase/migrations/001_improvements.sql
git commit -m "feat: add proximity, tags columns and recommendation_logs table"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Rewrite `types/index.ts`**

Replace the entire file content:

```typescript
export interface Restaurant {
  id: string
  name: string
  mrt_station: string | null
  items: string[]
  visited: boolean
  visit_date: string | null
  rating: number | null       // 1-5
  review: string | null
  proximity: number | null    // 1-10, 1=far, 10=very close
  tags: string[]
  created_at: string
  updated_at: string
}

export interface RecommendRequest {
  item?: string
}

export interface RecommendResult {
  restaurant: Restaurant
  message: string
}

export interface RecommendResponse {
  results: RecommendResult[]
  reasoning: string
}

export interface FeedbackRequest {
  chosen_restaurant_id: string
  shown_restaurant_ids: string[]
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors (because other files still reference `Mood` and old types — that's fine at this stage, we fix them in subsequent tasks).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: update types — remove mood, add proximity/tags, multi-result recommend"
```

---

### Task 3: Remove Mood Feature from Recommendation Engine

**Files:**
- Modify: `lib/recommendation.ts`
- Modify: `app/api/recommend/route.ts`

- [ ] **Step 1: Rewrite `lib/recommendation.ts`**

Replace the entire file:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant, RecommendResponse } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function getRecommendation(
  item?: string,
  excludeIds: string[] = []
): Promise<RecommendResponse> {
  const db = createServiceClient()

  const { data: allRestaurants, error } = await db
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const restaurants = (allRestaurants as Restaurant[]).filter(
    r => !excludeIds.includes(r.id)
  )

  if (!allRestaurants || allRestaurants.length === 0) {
    return { results: [], reasoning: '目前還沒有任何餐廳紀錄，先去新增幾家吧！' }
  }
  if (restaurants.length === 0) {
    return { results: [], reasoning: '所有餐廳都推薦過了，要不要新增幾家？' }
  }

  const restaurantList = restaurants
    .map((r, i) =>
      `[${i}] ${r.name}` +
      ` | 捷運: ${r.mrt_station ?? '未知'}` +
      ` | 距離評分: ${r.proximity ?? '未填'}(1遠10近)` +
      ` | 品項: ${r.items.length ? r.items.join('、') : '未填'}` +
      ` | 標籤: ${r.tags.length ? r.tags.join('、') : '無'}` +
      ` | 評分: ${r.rating ?? '未吃過'}` +
      ` | ${r.visited ? `已造訪 ${r.visit_date?.slice(0, 10)}` : '未造訪'}` +
      ` | 短評: ${r.review ?? '無'}`
    )
    .join('\n')

  // Static part cached — dynamic part (item) stays uncached
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，距離評分和標籤是重要因子，以 JSON 回覆。',
      },
      {
        type: 'text',
        text: `<restaurants>\n${restaurantList}\n</restaurants>`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `<request>
<item>${item ?? '不限'}</item>
</request>

請推薦最多三家餐廳，優先考慮距離近（高分）和相關標籤。
回覆 JSON，格式如下：
{"indices": [<index1>, <index2>?, <index3>?], "messages": ["<推薦語1>", "<推薦語2>?", "<推薦語3>?"], "reasoning": "<整體推薦原因，1句>"}`,
      },
    ],
  })

  const text = (response.content[0] as { type: 'text'; text: string }).text
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)![0])

  const results = (json.indices as number[])
    .slice(0, 3)
    .map((idx: number, i: number) => ({
      restaurant: restaurants[idx] as Restaurant,
      message: json.messages[i] as string,
    }))
    .filter(r => r.restaurant != null)

  return { results, reasoning: json.reasoning }
}
```

- [ ] **Step 2: Rewrite `app/api/recommend/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRecommendation } from '@/lib/recommendation'
import { RecommendRequest } from '@/types'

export async function POST(req: NextRequest) {
  const body: RecommendRequest = await req.json()

  try {
    const result = await getRecommendation(body.item)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors only in UI files that still reference `Mood` — `recommendation.ts` and `route.ts` should be clean.

- [ ] **Step 4: Commit**

```bash
git add lib/recommendation.ts app/api/recommend/route.ts
git commit -m "feat: remove mood from recommendation engine, support up to 3 results"
```

---

### Task 4: Remove Mood from UI, Show Multi-Result Recommendations

**Files:**
- Modify: `app/recommend/page.tsx`
- Delete: `components/MoodSelector.tsx`

- [ ] **Step 1: Rewrite `app/recommend/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RecommendResponse } from '@/types'

export default function RecommendPage() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const handleRecommend = async () => {
    setLoading(true)
    setResult(null)
    setChosen(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: item || undefined }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  const handleChoose = async (restaurantId: string) => {
    if (!result || chosen) return
    setChosen(restaurantId)
    await fetch('/api/recommend/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chosen_restaurant_id: restaurantId,
        shown_restaurant_ids: result.results.map(r => r.restaurant.id),
      }),
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">推薦給我</h1>

      <div>
        <Label>想吃什麼品項（可留空）</Label>
        <Input
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：提拉米蘇、肉桂捲"
        />
      </div>

      <Button onClick={handleRecommend} disabled={loading} className="w-full" size="lg">
        {loading ? '推薦中...' : '推薦給我！'}
      </Button>

      {result && (
        <div className="space-y-4 pt-2 border-t">
          {result.reasoning && (
            <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </div>
          )}

          {result.results.length === 0 && (
            <p className="text-muted-foreground text-center">暫時沒有合適的推薦</p>
          )}

          {result.results.map(({ restaurant, message }) => (
            <div key={restaurant.id} className="space-y-2">
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/20">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <RestaurantCard
                restaurant={restaurant}
                onChoose={chosen ? undefined : () => handleChoose(restaurant.id)}
                isChosen={chosen === restaurant.id}
              />
            </div>
          ))}

          {chosen && (
            <p className="text-center text-sm text-muted-foreground">已記錄你的選擇！</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Delete `components/MoodSelector.tsx`**

```bash
rm E:/Projects/food-picker/components/MoodSelector.tsx
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors about `onChoose` and `isChosen` props on `RestaurantCard` — these will be fixed in the next task. Errors about `MoodSelector` should be gone.

- [ ] **Step 4: Commit**

```bash
git add app/recommend/page.tsx
git rm components/MoodSelector.tsx
git commit -m "feat: remove mood selector, show multi-result recommendations with selection"
```

---

### Task 5: Update RestaurantCard with Proximity, Tags, and Choose Button

**Files:**
- Modify: `components/RestaurantCard.tsx`

- [ ] **Step 1: Rewrite `components/RestaurantCard.tsx`**

```tsx
import { Restaurant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Navigation } from 'lucide-react'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen }: Props) {
  return (
    <Card className={`w-full ${isChosen ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
          <div className="flex items-center gap-2">
            {restaurant.proximity && (
              <div className="flex items-center gap-1 text-blue-500">
                <Navigation className="h-4 w-4" />
                <span className="text-sm font-medium">{restaurant.proximity}/10</span>
              </div>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{restaurant.rating}</span>
              </div>
            )}
          </div>
        </div>
        {restaurant.mrt_station && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {restaurant.mrt_station}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-2">
          {restaurant.items.map(item => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
          {!restaurant.visited && (
            <Badge variant="outline">未造訪</Badge>
          )}
        </div>
        {restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.tags.map(tag => (
              <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        {restaurant.review && (
          <p className="text-sm text-muted-foreground">{restaurant.review}</p>
        )}
        <div className="flex gap-2 mt-2">
          {onChoose && (
            <Button size="sm" onClick={onChoose} className="flex-1">
              就選這家！
            </Button>
          )}
          {isChosen && (
            <span className="text-sm text-primary font-medium self-center">✓ 已選擇</span>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(restaurant.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              刪除
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors should now be only in `RestaurantForm.tsx` (proximity field not added yet).

- [ ] **Step 3: Commit**

```bash
git add components/RestaurantCard.tsx
git commit -m "feat: add proximity score, tags, and choose button to RestaurantCard"
```

---

### Task 6: Add Proximity Selector and Tags to RestaurantForm

**Files:**
- Modify: `components/RestaurantForm.tsx`
- Modify: `app/api/restaurants/route.ts`

- [ ] **Step 1: Rewrite `components/RestaurantForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Restaurant } from '@/types'

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
}

export function RestaurantForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [mrtStation, setMrtStation] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [itemInput, setItemInput] = useState('')
  const [visited, setVisited] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [proximity, setProximity] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [generatingTags, setGeneratingTags] = useState(false)
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const trimmed = itemInput.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
      setItemInput('')
    }
  }

  const removeItem = (item: string) => {
    setItems(prev => prev.filter(i => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
  }

  const handleGenerateTags = async () => {
    if (!review.trim()) return
    setGeneratingTags(true)
    const res = await fetch('/api/restaurants/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review, name, items }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags(data.tags ?? [])
    }
    setGeneratingTags(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSubmit({
      name: name.trim(),
      mrt_station: mrtStation.trim() || null,
      items,
      visited,
      visit_date: visited && visitDate ? new Date(visitDate).toISOString() : null,
      rating: visited ? rating : null,
      review: review.trim() || null,
      proximity,
      tags,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>店名 *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="餐廳名稱" required />
      </div>
      <div>
        <Label>捷運站</Label>
        <Input value={mrtStation} onChange={e => setMrtStation(e.target.value)} placeholder="例：大安、信義安和" />
      </div>
      <div>
        <Label>距離評分（1=很遠，10=超近）</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button type="button" key={n} onClick={() => setProximity(n)}
              className={`w-9 h-9 rounded-full border text-sm font-medium ${
                proximity === n ? 'bg-primary text-primary-foreground' : 'border-border'
              }`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>品項</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例：提拉米蘇、焦糖拿鐵（Enter 新增）"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addItem}>新增</Button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {items.map(item => (
              <span key={item}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground">
                {item}
                <button type="button" onClick={() => removeItem(item)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="visited" checked={visited} onChange={e => setVisited(e.target.checked)} />
        <Label htmlFor="visited">已造訪</Label>
      </div>
      {visited && (
        <>
          <div>
            <Label>造訪日期</Label>
            <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
          </div>
          <div>
            <Label>評分 (1-5)</Label>
            <div className="flex gap-2 mt-1">
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-full border text-sm font-medium ${
                    rating === n ? 'bg-primary text-primary-foreground' : 'border-border'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>短評</Label>
            <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="口感如何？推薦指數？" />
            {review.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleGenerateTags}
                disabled={generatingTags}
              >
                {generatingTags ? '生成標籤中...' : '自動生成標籤'}
              </Button>
            )}
          </div>
          {tags.length > 0 && (
            <div>
              <Label>標籤</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '儲存中...' : '新增餐廳'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Update `app/api/restaurants/route.ts` to include proximity and tags**

In the `POST` handler, update the `insert` object:

```typescript
  const insert: Partial<Restaurant> = {
    name: body.name,
    mrt_station: body.mrt_station ?? null,
    items: body.items ?? [],
    visited: body.visited ?? false,
    visit_date: body.visit_date ?? null,
    rating: body.rating ?? null,
    review: body.review ?? null,
    proximity: body.proximity ?? null,
    tags: body.tags ?? [],
  }
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: Clean (or only errors in files not yet touched).

- [ ] **Step 4: Commit**

```bash
git add components/RestaurantForm.tsx app/api/restaurants/route.ts
git commit -m "feat: add proximity selector and tag generation trigger to restaurant form"
```

---

### Task 7: Tag Generation API Route

**Files:**
- Create: `app/api/restaurants/generate-tags/route.ts`

- [ ] **Step 1: Create `app/api/restaurants/generate-tags/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { review, name, items } = await req.json()

  if (!review?.trim()) {
    return NextResponse.json({ error: 'review is required' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `根據以下餐廳資訊，生成 3-5 個簡短的繁體中文標籤（每個標籤 2-4 字）。
只回覆 JSON 陣列，例如：["咖啡廳", "甜點", "適合約會"]

餐廳：${name}
品項：${items?.join('、') ?? '未填'}
短評：${review}`,
        },
      ],
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text
    const tags = JSON.parse(text.match(/\[[\s\S]*\]/)![0]) as string[]
    return NextResponse.json({ tags })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1 | head -40
```

Expected: No errors from this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/restaurants/generate-tags/route.ts
git commit -m "feat: add generate-tags API route using Claude Haiku"
```

---

### Task 8: Recommendation Feedback API Route

**Files:**
- Create: `app/api/recommend/feedback/route.ts`

- [ ] **Step 1: Create `app/api/recommend/feedback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { FeedbackRequest } from '@/types'

export async function POST(req: NextRequest) {
  const body: FeedbackRequest = await req.json()

  if (!body.chosen_restaurant_id || !body.shown_restaurant_ids?.length) {
    return NextResponse.json({ error: 'chosen_restaurant_id and shown_restaurant_ids are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('recommendation_logs').insert({
    chosen_restaurant_id: body.chosen_restaurant_id,
    shown_restaurant_ids: body.shown_restaurant_ids,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript — full clean check**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit 2>&1
```

Expected: Zero errors. All tasks complete.

- [ ] **Step 3: Commit**

```bash
git add app/api/recommend/feedback/route.ts
git commit -m "feat: add recommendation feedback API to record user's restaurant choice"
```

---

### Task 9: Build Verification

- [ ] **Step 1: Run the production build**

```bash
cd E:/Projects/food-picker && npm run build 2>&1 | tail -20
```

Expected: Build completes successfully. Look for `✓ Compiled successfully` or similar.

- [ ] **Step 2: Start dev server and manual test**

```bash
cd E:/Projects/food-picker && npm run dev
```

Test checklist:
1. Go to `/restaurants/new` — verify proximity selector (1-10) is visible
2. Fill in a restaurant name and check the "已造訪" box — verify short review textarea appears
3. Write a review and click "自動生成標籤" — verify tags appear
4. Submit the form — verify restaurant saved (check `/restaurants` page)
5. Go to `/recommend` — verify mood selector is gone
6. Click "推薦給我！" — verify up to 3 restaurant cards appear
7. Click "就選這家！" on one card — verify it highlights and shows "已記錄你的選擇！"
8. Check Supabase `recommendation_logs` table — verify a row was inserted

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify build and complete food picker improvements"
```
