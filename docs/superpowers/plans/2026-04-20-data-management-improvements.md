# Data Management Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI summary generation, restaurant editing, tag editing, proximity slider labels, visited filter tabs, and recommend-page filters to the food-picker app.

**Architecture:** Extend `Restaurant` type with `ai_summary`, add a generate-summary API route, overhaul `RestaurantForm` to support edit mode with editable tags and a labeled proximity slider, apply pre-flight filtering in the recommend API route, and add filter controls to the recommend page and restaurant list page.

**Tech Stack:** Next.js 16 App Router, Supabase (`@supabase/supabase-js`), Anthropic SDK (Claude Haiku), Tailwind CSS v4, shadcn/ui

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260420_add_ai_summary.sql` | Create | ALTER TABLE to add ai_summary column |
| `types/index.ts` | Modify | Add `ai_summary` to Restaurant; extend RecommendRequest |
| `app/api/restaurants/generate-summary/route.ts` | Create | POST: generate AI summary from items/review/tags |
| `app/api/restaurants/route.ts` | Modify | Add `ai_summary` to POST insert object |
| `lib/recommendation.ts` | Modify | Accept pre-filtered restaurant list; include ai_summary in prompt |
| `app/api/recommend/route.ts` | Modify | Fetch + filter restaurants; pass to getRecommendation |
| `components/RestaurantForm.tsx` | Modify | `initialData` prop; tag editing; labeled proximity slider; AI summary field |
| `components/RestaurantCard.tsx` | Modify | Show ai_summary subtitle; add Edit button |
| `app/restaurants/[id]/edit/page.tsx` | Create | Fetch restaurant, render RestaurantForm in edit mode |
| `app/restaurants/page.tsx` | Modify | Visited filter tabs (全部 / 未造訪 / 已造訪) |
| `app/recommend/page.tsx` | Modify | Collapsible filter section (visited radio, tag chips, proximity slider) |

---

## Task 1: DB Migration + TypeScript Types

**Files:**
- Create: `supabase/migrations/20260420_add_ai_summary.sql`
- Modify: `types/index.ts`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260420_add_ai_summary.sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_summary text;
```

- [ ] **Step 2: Run the migration in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.
Expected: query completes without error; `restaurants` table now has `ai_summary text` column.

- [ ] **Step 3: Update TypeScript types**

Replace the contents of `types/index.ts` with:

```ts
export interface Restaurant {
  id: string
  name: string
  mrt_station: string | null
  items: string[]
  visited: boolean
  visit_date: string | null
  rating: number | null       // 1-5
  review: string | null
  proximity: number | null    // 1-10 (1=closest, 10=farthest per new UI labeling)
  tags: string[]
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export interface RecommendRequest {
  item?: string
  visited_filter?: 'all' | 'visited' | 'unvisited'
  tags?: string[]
  max_proximity?: number  // exclude restaurants with proximity > this value
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

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (Any errors about `ai_summary` in callers will be fixed in later tasks.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260420_add_ai_summary.sql types/index.ts
git commit -m "feat: add ai_summary column and extend types"
```

---

## Task 2: Generate-Summary API Route

**Files:**
- Create: `app/api/restaurants/generate-summary/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// app/api/restaurants/generate-summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { items, review, tags } = await req.json()

  const parts = [
    items?.length ? `品項：${(items as string[]).join('、')}` : null,
    tags?.length ? `標籤：${(tags as string[]).join('、')}` : null,
    review ? `短評：${review}` : null,
  ].filter(Boolean).join('；')

  if (!parts) {
    return NextResponse.json({ error: 'At least one of items, review, or tags is required' }, { status: 400 })
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `根據以下資訊，用一句話描述這家餐廳的特色（繁體中文，不超過30字）：${parts}`,
    }],
  })

  const ai_summary = (response.content[0] as { type: 'text'; text: string }).text.trim()
  return NextResponse.json({ ai_summary })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/restaurants/generate-summary/route.ts
git commit -m "feat: add generate-summary API route"
```

---

## Task 3: Update Restaurant CRUD API (POST with ai_summary)

**Files:**
- Modify: `app/api/restaurants/route.ts`

> `GET /api/restaurants` uses `select('*')` and already returns `ai_summary` now that the column exists. `PATCH /api/restaurants/[id]` spreads the body directly, so it already accepts `ai_summary`. Only `POST` needs updating since it builds an explicit insert object.

- [ ] **Step 1: Add ai_summary to the POST insert object**

In `app/api/restaurants/route.ts`, find the `insert` object inside `POST` and add `ai_summary`:

```ts
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
    ai_summary: body.ai_summary ?? null,
  }
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/restaurants/route.ts
git commit -m "feat: include ai_summary in POST /api/restaurants"
```

---

## Task 4: Update Recommendation Engine + Recommend API Route

**Files:**
- Modify: `lib/recommendation.ts`
- Modify: `app/api/recommend/route.ts`

The recommend API will now fetch restaurants, apply filters from the request body, then pass the filtered list to `getRecommendation`. The engine skips the DB fetch when a pre-filtered list is supplied.

- [ ] **Step 1: Update lib/recommendation.ts**

Replace the full file:

```ts
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant, RecommendResponse } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function getRecommendation(
  item?: string,
  excludeIds: string[] = [],
  preFiltered?: Restaurant[]
): Promise<RecommendResponse> {
  let restaurants: Restaurant[]

  if (preFiltered) {
    restaurants = preFiltered.filter(r => !excludeIds.includes(r.id))
  } else {
    const db = createServiceClient()
    const { data: allRestaurants, error } = await db
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!allRestaurants || allRestaurants.length === 0) {
      return { results: [], reasoning: '目前還沒有任何餐廳紀錄，先去新增幾家吧！' }
    }
    restaurants = (allRestaurants as Restaurant[]).filter(r => !excludeIds.includes(r.id))
  }

  if (restaurants.length === 0) {
    return { results: [], reasoning: '沒有符合條件的餐廳，試試調整篩選條件？' }
  }

  const restaurantList = restaurants
    .map((r, i) =>
      `[${i}] ${r.name}` +
      ` | 捷運: ${r.mrt_station ?? '未知'}` +
      ` | 品項: ${r.items.length ? r.items.join('、') : '未填'}` +
      ` | 標籤: ${r.tags.length ? r.tags.join('、') : '無'}` +
      ` | 摘要: ${r.ai_summary ?? '無'}` +
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
        text: '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，標籤是重要因子，以 JSON 回覆。',
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

請推薦最多三家餐廳，優先考慮相關標籤。
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

- [ ] **Step 2: Update app/api/recommend/route.ts**

Replace the full file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getRecommendation } from '@/lib/recommendation'
import { RecommendRequest, Restaurant } from '@/types'

export async function POST(req: NextRequest) {
  const body: RecommendRequest = await req.json()

  try {
    const db = createServiceClient()
    const { data: allRestaurants, error } = await db
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    let filtered = (allRestaurants ?? []) as Restaurant[]

    if (body.visited_filter === 'visited') {
      filtered = filtered.filter(r => r.visited)
    } else if (body.visited_filter === 'unvisited') {
      filtered = filtered.filter(r => !r.visited)
    }

    if (body.tags?.length) {
      filtered = filtered.filter(r =>
        body.tags!.some(t => r.tags.includes(t))
      )
    }

    if (body.max_proximity != null) {
      filtered = filtered.filter(r =>
        r.proximity == null || r.proximity <= body.max_proximity!
      )
    }

    const result = await getRecommendation(body.item, [], filtered)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/recommendation.ts app/api/recommend/route.ts
git commit -m "feat: recommendation engine accepts pre-filtered list; add ai_summary to prompt"
```

---

## Task 5: RestaurantForm Overhaul

**Files:**
- Modify: `components/RestaurantForm.tsx`

Changes:
- Add `initialData?: Restaurant` prop — when present, form is in edit mode and all state is pre-populated
- Submit label: "新增餐廳" (create) or "儲存變更" (edit)
- Proximity: replace button grid with labeled range slider (1=closest, 10=farthest)
- Tags: each chip gets ✕ button; add text input below chips (Enter to add); AI generate button stays
- AI Summary: "生成 AI 摘要" button below review field; result fills editable textarea; always submitted

- [ ] **Step 1: Replace RestaurantForm.tsx**

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

const PROXIMITY_LABELS: Record<number, string> = {
  1: '走路 5 分鐘',
  2: '走路 15 分鐘',
  3: '走路 30 分鐘',
  4: '搭車 15 分鐘',
  5: '搭車快一小時',
  6: '搭車一小時以上',
  7: '開車才方便',
  8: '跨縣市',
  9: '台灣另一端',
  10: '出國的',
}

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
}

export function RestaurantForm({ onSubmit, initialData }: Props) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [mrtStation, setMrtStation] = useState(initialData?.mrt_station ?? '')
  const [items, setItems] = useState<string[]>(initialData?.items ?? [])
  const [itemInput, setItemInput] = useState('')
  const [visited, setVisited] = useState(initialData?.visited ?? false)
  const [visitDate, setVisitDate] = useState(
    initialData?.visit_date ? initialData.visit_date.slice(0, 10) : ''
  )
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null)
  const [review, setReview] = useState(initialData?.review ?? '')
  const [proximity, setProximity] = useState<number>(initialData?.proximity ?? 5)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [aiSummary, setAiSummary] = useState(initialData?.ai_summary ?? '')
  const [generatingTags, setGeneratingTags] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const trimmed = itemInput.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
      setItemInput('')
    }
  }

  const removeItem = (item: string) => setItems(prev => prev.filter(i => i !== item))

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
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

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true)
    const res = await fetch('/api/restaurants/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, review: review.trim() || null, tags }),
    })
    if (res.ok) {
      const data = await res.json()
      setAiSummary(data.ai_summary ?? '')
    }
    setGeneratingSummary(false)
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
      ai_summary: aiSummary.trim() || null,
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
        <Label>距離</Label>
        <div className="mt-2 space-y-1">
          <input
            type="range"
            min={1}
            max={10}
            value={proximity}
            onChange={e => setProximity(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">{PROXIMITY_LABELS[proximity]}</p>
        </div>
      </div>
      <div>
        <Label>品項</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={handleItemKeyDown}
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
            <div className="flex gap-2 mt-2">
              {review.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTags}
                  disabled={generatingTags}
                >
                  {generatingTags ? '生成標籤中...' : '建議標籤'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
              >
                {generatingSummary ? '生成中...' : '生成 AI 摘要'}
              </Button>
            </div>
          </div>
          <div>
            <Label>標籤</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="手動新增標籤（Enter）"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>新增</Button>
            </div>
          </div>
          <div>
            <Label>AI 摘要</Label>
            <Textarea
              value={aiSummary}
              onChange={e => setAiSummary(e.target.value)}
              placeholder="點「生成 AI 摘要」自動填寫，也可手動編輯"
              rows={2}
            />
          </div>
        </>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增餐廳'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/RestaurantForm.tsx
git commit -m "feat: overhaul RestaurantForm with edit mode, tag editing, proximity slider, AI summary"
```

---

## Task 6: RestaurantCard + Edit Page

**Files:**
- Modify: `components/RestaurantCard.tsx`
- Create: `app/restaurants/[id]/edit/page.tsx`

- [ ] **Step 1: Update RestaurantCard**

Replace the full file:

```tsx
import { Restaurant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Navigation } from 'lucide-react'
import Link from 'next/link'

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
          <div>
            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
            {restaurant.ai_summary && (
              <p className="text-sm text-muted-foreground mt-0.5">{restaurant.ai_summary}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
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
            <Link href={`/restaurants/${restaurant.id}/edit`}>
              <button className="text-xs text-blue-400 hover:text-blue-600">
                編輯
              </button>
            </Link>
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

- [ ] **Step 2: Create the edit page**

```tsx
// app/restaurants/[id]/edit/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RestaurantForm } from '@/components/RestaurantForm'
import { Restaurant } from '@/types'

export default function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/restaurants/${id}`)
      .then(r => r.json())
      .then(data => {
        setRestaurant(data)
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (data: Partial<Restaurant>) => {
    await fetch(`/api/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.push('/restaurants')
  }

  if (loading) return <p className="text-center text-muted-foreground">載入中...</p>
  if (!restaurant) return <p className="text-center text-muted-foreground">找不到餐廳</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">編輯餐廳</h1>
      <RestaurantForm onSubmit={handleSubmit} initialData={restaurant} />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/RestaurantCard.tsx app/restaurants/[id]/edit/page.tsx
git commit -m "feat: add ai_summary subtitle and edit button to RestaurantCard; add edit page"
```

---

## Task 7: Restaurant List Visited Filter Tabs

**Files:**
- Modify: `app/restaurants/page.tsx`

- [ ] **Step 1: Replace restaurants/page.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Restaurant } from '@/types'

type Tab = '全部' | '未造訪' | '已造訪'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('全部')

  const fetchRestaurants = async () => {
    const res = await fetch('/api/restaurants')
    const data = await res.json()
    setRestaurants(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => { fetchRestaurants() }, [])

  const filtered = restaurants.filter(r => {
    if (tab === '未造訪') return !r.visited
    if (tab === '已造訪') return r.visited
    return true
  })

  if (loading) return <p className="text-center text-muted-foreground">載入中...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">餐廳清單</h1>
      <div className="flex gap-2">
        {(['全部', '未造訪', '已造訪'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} 家餐廳</p>
      {filtered.length === 0 && (
        <p className="text-muted-foreground">沒有符合條件的餐廳</p>
      )}
      {filtered.map(r => (
        <RestaurantCard key={r.id} restaurant={r} onDelete={handleDelete} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/restaurants/page.tsx
git commit -m "feat: add visited filter tabs to restaurant list"
```

---

## Task 8: Recommend Page Filter UI

**Files:**
- Modify: `app/recommend/page.tsx`

The filter section is collapsible. Tag chips are fetched on page load (deduplicated from all restaurants). Filter values are sent in the POST body.

- [ ] **Step 1: Replace recommend/page.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RecommendResponse } from '@/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

const PROXIMITY_LABELS: Record<number, string> = {
  1: '走路 5 分鐘',
  2: '走路 15 分鐘',
  3: '走路 30 分鐘',
  4: '搭車 15 分鐘',
  5: '搭車快一小時',
  6: '搭車一小時以上',
  7: '開車才方便',
  8: '跨縣市',
  9: '台灣另一端',
  10: '出國的',
}

export default function RecommendPage() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visitedFilter, setVisitedFilter] = useState<'all' | 'visited' | 'unvisited'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [maxProximity, setMaxProximity] = useState(10)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then((data: { tags?: string[] }[]) => {
        const tags = Array.from(new Set(data.flatMap(r => r.tags ?? [])))
        setAllTags(tags)
      })
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleRecommend = async () => {
    setLoading(true)
    setResult(null)
    setChosen(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item: item || undefined,
        visited_filter: visitedFilter,
        tags: selectedTags.length ? selectedTags : undefined,
        max_proximity: maxProximity < 10 ? maxProximity : undefined,
      }),
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
        <Label>說些什麼，讓我來幫你找餐廳!</Label>
        <Input
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：我想要包子、今天心情不美麗"
        />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span>篩選條件</span>
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 space-y-4 border-t">
            <div className="pt-4">
              <Label className="text-xs text-muted-foreground">已造訪</Label>
              <div className="flex gap-3 mt-1">
                {([['all', '全部'], ['unvisited', '只推未造訪'], ['visited', '只推已造訪']] as const).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="visited_filter"
                      value={val}
                      checked={visitedFilter === val}
                      onChange={() => setVisitedFilter(val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">標籤（不選 = 不限）</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">
                距離上限：{maxProximity === 10 ? '不限' : PROXIMITY_LABELS[maxProximity]}
              </Label>
              <input
                type="range"
                min={1}
                max={10}
                value={maxProximity}
                onChange={e => setMaxProximity(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        )}
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

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/recommend/page.tsx
git commit -m "feat: add collapsible filter section to recommend page"
```

---

## Task 9: Post-Deploy SQL Fix for Existing Proximity Values

> Run this **once** in Supabase Dashboard → SQL Editor after deploying, to correct existing rows to match the new proximity direction (1=closest, 10=farthest).

- [ ] **Step 1: Run in Supabase Dashboard**

```sql
UPDATE restaurants SET proximity = 11 - proximity WHERE proximity IS NOT NULL;
```

Expected: affected row count = number of restaurants that had a proximity value set.

---

## Self-Review Checklist

### Spec coverage

| Spec section | Covered by |
|-------------|-----------|
| DB Migration: add ai_summary | Task 1 |
| TypeScript: add ai_summary to Restaurant | Task 1 |
| TypeScript: extend RecommendRequest | Task 1 |
| POST /api/restaurants/generate-summary | Task 2 |
| GET /api/restaurants returns ai_summary | Automatic (select *) |
| POST /api/restaurants accepts ai_summary | Task 3 |
| PATCH /api/restaurants/[id] accepts ai_summary | Automatic (spread body) |
| app/restaurants/[id]/edit/page.tsx | Task 6 |
| RestaurantForm: initialData prop | Task 5 |
| RestaurantForm: submit label by mode | Task 5 |
| RestaurantCard: Edit button | Task 6 |
| Tag editing: ✕ to remove | Task 5 |
| Tag editing: manual add via text input | Task 5 |
| Tag editing: AI generate button stays | Task 5 |
| AI Summary: button + editable textarea | Task 5 |
| AI Summary: stored in ai_summary | Task 5 |
| RestaurantCard: ai_summary subtitle | Task 6 |
| Recommendation engine: pass ai_summary in prompt | Task 4 |
| Proximity slider 1–10 with labels | Task 5 |
| Proximity slider in Recommend page filter | Task 8 |
| Restaurant list visited filter tabs | Task 7 |
| Recommend page collapsible filter section | Task 8 |
| visited_filter radio | Task 8 |
| tag chip multi-select | Task 8 |
| max_proximity slider | Task 8 |
| RecommendRequest extended | Task 1 |
| API route applies filters before getRecommendation | Task 4 |
| Tag chips fetched from GET /api/restaurants | Task 8 |
| Proximity SQL fix note | Task 9 |

All spec requirements covered. No gaps found.
