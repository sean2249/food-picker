# Todo Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four UX/feature improvements: visited badge on cards, remove visit_date from UI, review-priority in AI prompt, keep filters open after recommendation + add re-recommend button, changelog on home page, and cancel button on edit form.

**Architecture:** All changes are UI-only or prompt-level — no new API routes, no DB migrations. The changelog feature uses webpack `asset/source` to bundle markdown files at build time (Cloudflare Workers compatible). Everything else is component-level state or string changes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui, Anthropic SDK (claude-haiku-4-5-20251001), webpack asset/source for .md imports

---

## File Map

| File | Change |
|------|--------|
| `components/RestaurantCard.tsx` | Add visited badge (green/gray) |
| `components/RestaurantForm.tsx` | Remove visit_date field; add onCancel prop + button |
| `app/restaurants/[id]/edit/page.tsx` | Pass onCancel → router.back() |
| `lib/recommendation.ts` | Move review to front of prompt; update system message |
| `app/recommend/page.tsx` | Auto-open filters after results; add 重新推薦 button |
| `next.config.ts` | Add webpack rule: `.md` → `asset/source` |
| `types/markdown.d.ts` | TypeScript declaration for `*.md` imports |
| `lib/releases.ts` | Static-import release .md files; export newest 3 |
| `app/page.tsx` | Add changelog section using releases |

---

## Task 1: RestaurantCard — Visited Badge

**Files:**
- Modify: `components/RestaurantCard.tsx:49-56`

- [ ] **Step 1: Replace the current visited badge logic**

Current code in `RestaurantCard.tsx` (lines 49-56):
```tsx
<div className="flex flex-wrap gap-1 mb-2">
  {restaurant.items.map(item => (
    <Badge key={item} variant="secondary">{item}</Badge>
  ))}
  {!restaurant.visited && (
    <Badge variant="outline">未造訪</Badge>
  )}
</div>
```

Replace with (adds green badge for visited, keeps gray for unvisited):
```tsx
<div className="flex flex-wrap gap-1 mb-2">
  {restaurant.items.map(item => (
    <Badge key={item} variant="secondary">{item}</Badge>
  ))}
  {restaurant.visited ? (
    <Badge className="bg-green-100 text-green-700 border-green-200">✓ 已造訪</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">未造訪</Badge>
  )}
</div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/RestaurantCard.tsx
git commit -m "feat: add visited/unvisited badge to RestaurantCard"
```

---

## Task 2: RestaurantForm — Remove visit_date + Add onCancel

**Files:**
- Modify: `components/RestaurantForm.tsx`

- [ ] **Step 1: Remove visitDate state**

In `RestaurantForm.tsx`, remove lines 36-38:
```ts
const [visitDate, setVisitDate] = useState(
  initialData?.visit_date ? initialData.visit_date.slice(0, 10) : ''
)
```

- [ ] **Step 2: Remove visit_date from handleSubmit**

In `handleSubmit` (around line 110), change:
```ts
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
```
To:
```ts
await onSubmit({
  name: name.trim(),
  mrt_station: mrtStation.trim() || null,
  items,
  visited,
  rating: visited ? rating : null,
  review: review.trim() || null,
  proximity,
  tags,
  ai_summary: aiSummary.trim() || null,
})
```

- [ ] **Step 3: Remove visit_date input from JSX**

Inside the `{visited && (<>...</>)}` block (around line 179), remove the visit_date div:
```tsx
<div>
  <Label>造訪日期</Label>
  <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
</div>
```

- [ ] **Step 4: Add onCancel prop**

Change the `Props` interface (around line 23):
```ts
interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
}
```
To:
```ts
interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
  onCancel?: () => void
}
```

Update the function signature (line 28):
```ts
export function RestaurantForm({ onSubmit, initialData, onCancel }: Props) {
```

- [ ] **Step 5: Add cancel button next to submit**

Change the submit button (around line 258):
```tsx
<Button type="submit" disabled={loading} className="w-full">
  {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增餐廳'}
</Button>
```
To:
```tsx
<div className="flex gap-2">
  <Button type="submit" disabled={loading} className="flex-1">
    {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增餐廳'}
  </Button>
  {onCancel && (
    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
      取消
    </Button>
  )}
</div>
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/RestaurantForm.tsx
git commit -m "feat: remove visit_date from form UI; add onCancel prop with cancel button"
```

---

## Task 3: Edit Page — Wire onCancel

**Files:**
- Modify: `app/restaurants/[id]/edit/page.tsx`

- [ ] **Step 1: Pass onCancel to RestaurantForm**

In `app/restaurants/[id]/edit/page.tsx`, the return statement currently is:
```tsx
return (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">編輯餐廳</h1>
    <RestaurantForm onSubmit={handleSubmit} initialData={restaurant} />
  </div>
)
```

Change to:
```tsx
return (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">編輯餐廳</h1>
    <RestaurantForm
      onSubmit={handleSubmit}
      initialData={restaurant}
      onCancel={() => router.back()}
    />
  </div>
)
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/restaurants/[id]/edit/page.tsx
git commit -m "feat: add cancel button to edit restaurant page"
```

---

## Task 4: Recommendation Engine — Review Priority

**Files:**
- Modify: `lib/recommendation.ts:34-73`

- [ ] **Step 1: Move review to front of restaurant description**

In `lib/recommendation.ts`, change the `restaurantList` mapping (lines 34-45):
```ts
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
```
To (review first, visit_date removed, system message updated):
```ts
const restaurantList = restaurants
  .map((r, i) =>
    `[${i}] ${r.name}` +
    ` | 摘要: ${r.ai_summary ?? '無'}` +
    ` | 標籤: ${r.tags.length ? r.tags.join('、') : '無'}` +
    ` | 評語: ${r.review ?? '無'}` +
    ` | 品項: ${r.items.length ? r.items.join('、') : '未填'}` +
    ` | 捷運: ${r.mrt_station ?? '未知'}` +
    ` | 評分: ${r.rating ?? '未吃過'}` +
    ` | ${r.visited ? '已造訪' : '未造訪'}`
  )
  .join('\n')
```

- [ ] **Step 2: Update system prompt to reflect review priority**

Change the system message text (line 54):
```ts
text: '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，標籤是重要因子，以 JSON 回覆。',
```
To:
```ts
text: '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，摘要與標籤是重要因子，以 JSON 回覆。',
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/recommendation.ts
git commit -m "feat: prioritize review in AI recommendation prompt"
```

---

## Task 5: Recommend Page — Filters Stay Open + 重新推薦 Button

**Files:**
- Modify: `app/recommend/page.tsx`

- [ ] **Step 1: Auto-open filters after results arrive**

In `handleRecommend` (around line 50), after `setResult(data)`:
```ts
const handleRecommend = async () => {
  setLoading(true)
  setResult(null)
  setChosen(null)
  const res = await fetch('/api/recommend', { ... })
  const data = await res.json()
  setResult(data)
  setLoading(false)
}
```
Add `setFiltersOpen(true)` after `setResult(data)`:
```ts
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
  setFiltersOpen(true)
  setLoading(false)
}
```

- [ ] **Step 2: Add 重新推薦 button in results section**

Find the results section (around line 168):
```tsx
{result && (
  <div className="space-y-4 pt-2 border-t">
    {result.reasoning && (
      <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
        <p className="text-sm text-muted-foreground">{result.reasoning}</p>
      </div>
    )}
```

Add the re-recommend button right after the opening div:
```tsx
{result && (
  <div className="space-y-4 pt-2 border-t">
    <Button
      onClick={handleRecommend}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? '推薦中...' : '調整篩選後重新推薦'}
    </Button>
    {result.reasoning && (
      <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
        <p className="text-sm text-muted-foreground">{result.reasoning}</p>
      </div>
    )}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/recommend/page.tsx
git commit -m "feat: keep filters open after recommendation; add re-recommend button"
```

---

## Task 6: Changelog on Home Page

**Files:**
- Modify: `next.config.ts`
- Create: `types/markdown.d.ts`
- Create: `lib/releases.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add webpack rule for .md files**

Replace `next.config.ts` content:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })
    return config
  },
};

export default nextConfig;
```

- [ ] **Step 2: Add TypeScript declaration for .md imports**

Create `types/markdown.d.ts`:
```ts
declare module '*.md' {
  const content: string
  export default content
}
```

- [ ] **Step 3: Create lib/releases.ts**

Create `lib/releases.ts`:
```ts
import r1 from '../docs/releases/2026-04-20-v1.0.0.md'

interface Release {
  filename: string
  content: string
}

const all: Release[] = [
  { filename: '2026-04-20-v1.0.0.md', content: r1 },
]

export const releases = all
  .sort((a, b) => b.filename.localeCompare(a.filename))
  .slice(0, 3)

export function parseReleaseTitle(content: string): string {
  return content.match(/^# (.+)$/m)?.[1] ?? '更新記錄'
}

export function parseReleaseDate(content: string): string {
  return content.match(/\*\*發布日期：\*\* (.+)/)?.[1]?.trim() ?? ''
}

export function parseReleaseSections(content: string): string[] {
  return content.match(/^### .+$/gm)?.map(s => s.replace(/^### /, '')) ?? []
}
```

- [ ] **Step 4: Update app/page.tsx with changelog section**

Replace `app/page.tsx` content:
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { releases, parseReleaseTitle, parseReleaseDate, parseReleaseSections } from '@/lib/releases'

export default function Home() {
  return (
    <div className="space-y-8 pt-12">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">美食選擇器</h1>
        <p className="text-muted-foreground">根據你的心情與天氣，找到最適合的美食</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/recommend">
            <Button size="lg" className="w-full">我餓了！推薦我</Button>
          </Link>
          <Link href="/restaurants/new">
            <Button variant="outline" className="w-full">新增餐廳</Button>
          </Link>
          <Link href="/restaurants">
            <Button variant="ghost" className="w-full">查看所有餐廳</Button>
          </Link>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <p className="px-4 py-3 text-sm font-semibold border-b bg-muted/30">更新記錄</p>
        {releases.map((release, i) => (
          <details key={release.filename} open={i === 0} className="border-b last:border-0">
            <summary className="px-4 py-3 text-sm cursor-pointer hover:bg-muted list-none flex items-center justify-between">
              <span className="font-medium">{parseReleaseTitle(release.content)}</span>
              {parseReleaseDate(release.content) && (
                <span className="text-muted-foreground text-xs">{parseReleaseDate(release.content)}</span>
              )}
            </summary>
            <ul className="px-6 pb-3 pt-1 space-y-1">
              {parseReleaseSections(release.content).map(section => (
                <li key={section} className="text-sm text-muted-foreground list-disc ml-2">{section}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd E:/Projects/food-picker && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Run build to confirm webpack rule works**

```bash
cd E:/Projects/food-picker && npm run build
```

Expected: build succeeds, no module parse errors for .md files

- [ ] **Step 7: Commit**

```bash
git add next.config.ts types/markdown.d.ts lib/releases.ts app/page.tsx
git commit -m "feat: add changelog section to home page using static release note imports"
```

---

## Adding Future Releases

When a new release is added to `docs/releases/`, update `lib/releases.ts`:
1. Add `import rN from '../docs/releases/YYYY-MM-DD-vX.Y.Z.md'`
2. Add `{ filename: 'YYYY-MM-DD-vX.Y.Z.md', content: rN }` to the `all` array
The sort + slice automatically keeps only the newest 3.
