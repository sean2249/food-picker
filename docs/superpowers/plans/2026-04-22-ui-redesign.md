# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform food-picker from a generic AI-looking app into a warm, playful, handmade-feeling personal food notebook — by overhauling the color token system, typography, RestaurantCard design, background texture, and accessibility.

**Architecture:** All color changes flow from `globals.css` token definitions → Tailwind `@theme inline` → component classes. No component holds hard-coded color values. Font is loaded once in `layout.tsx` and propagated via CSS variable. RestaurantCard receives a complete visual redesign including inline delete confirmation state.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Noto Serif TC (Google Fonts), lucide-react, React 19

**Spec:** `docs/superpowers/specs/2026-04-22-ui-redesign-design.md`

**Verification command:** `npm run build` (must pass — use `--webpack` flag is already in the script)

---

## Task 1: Color Token System

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the `:root` block with warm OKLCH tokens**

Open `app/globals.css`. Replace the entire `:root { ... }` block (lines roughly 53–76 in the current file) with:

```css
:root {
  /* Backgrounds — warm, never pure white */
  --background:             oklch(0.980 0.010 72);
  --card:                   oklch(0.995 0.008 72);
  --muted:                  oklch(0.945 0.012 70);

  /* Text — warm browns, not pure black */
  --foreground:             oklch(0.180 0.025 55);
  --muted-foreground:       oklch(0.520 0.030 60);

  /* Brand orange — single source of truth for #E46C0A */
  --brand:                  oklch(0.580 0.165 48);
  --brand-foreground:       oklch(0.995 0 0);

  /* Visited state badge */
  --visited:                oklch(0.870 0.060 48);
  --visited-foreground:     oklch(0.420 0.120 48);

  /* shadcn system tokens (kept for component compat) */
  --primary:                oklch(0.580 0.165 48);
  --primary-foreground:     oklch(0.995 0 0);
  --secondary:              oklch(0.945 0.012 70);
  --secondary-foreground:   oklch(0.180 0.025 55);
  --accent:                 oklch(0.945 0.012 70);
  --accent-foreground:      oklch(0.180 0.025 55);
  --destructive:            oklch(0.577 0.245 27.325);
  --popover:                oklch(0.995 0.008 72);
  --popover-foreground:     oklch(0.180 0.025 55);

  /* Borders */
  --border:                 oklch(0.880 0.018 68);
  --input:                  oklch(0.880 0.018 68);
  --ring:                   oklch(0.580 0.165 48);
  --radius:                 0.75rem;

  /* Sidebar (keep for compat) */
  --sidebar:                oklch(0.980 0.010 72);
  --sidebar-foreground:     oklch(0.180 0.025 55);
  --sidebar-primary:        oklch(0.580 0.165 48);
  --sidebar-primary-foreground: oklch(0.995 0 0);
  --sidebar-accent:         oklch(0.945 0.012 70);
  --sidebar-accent-foreground: oklch(0.180 0.025 55);
  --sidebar-border:         oklch(0.880 0.018 68);
  --sidebar-ring:           oklch(0.580 0.165 48);
}
```

- [ ] **Step 2: Add brand tokens to `@theme inline` block**

In the same file, inside the existing `@theme inline { ... }` block, add after the last `--color-*` line:

```css
  --color-brand:              var(--brand);
  --color-brand-foreground:   var(--brand-foreground);
  --color-visited:            var(--visited);
  --color-visited-foreground: var(--visited-foreground);
```

- [ ] **Step 3: Add global focus-visible rule**

At the bottom of `app/globals.css`, add:

```css
*:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript or CSS errors. The build output should show compiled CSS with the new tokens.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): warm OKLCH color tokens + brand/visited token aliases + focus-visible"
```

---

## Task 2: Typography — Noto Serif TC

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace Inter with Noto Serif TC in `layout.tsx`**

Replace the entire current `layout.tsx` content with:

```tsx
import type { Metadata } from 'next'
import { Noto_Serif_TC } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '美食選擇器',
  description: '心情天氣美食推薦',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={notoSerifTC.variable}>
      <body>
        <nav className="border-b px-4 py-3 flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary">首頁</Link>
          <Link href="/recommend" className="hover:text-primary">推薦給我</Link>
          <Link href="/restaurants/new" className="hover:text-primary">新增餐廳</Link>
          <Link href="/restaurants" className="hover:text-primary">餐廳清單</Link>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Wire `--font-serif` to Tailwind's `--font-sans` in `globals.css`**

In the `@theme inline { ... }` block, find the line:
```css
  --font-sans: var(--font-sans);
```
Replace it with:
```css
  --font-sans: var(--font-serif);
```

If the line currently reads `--font-sans: var(--font-sans)` or similar, replace it. If the line doesn't exist, add `--font-sans: var(--font-serif);` inside the `@theme inline` block.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds, no font-related errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(ui): replace Inter with Noto Serif TC"
```

---

## Task 3: Background SVG Texture

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add the food doodle SVG to `layout.tsx`**

Inside the `<body>` tag, immediately before `<nav ...>`, add the following SVG:

```tsx
<svg
  aria-hidden="true"
  className="fixed inset-0 w-full h-full pointer-events-none -z-10 opacity-10"
  viewBox="0 0 800 600"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  stroke="#C4650A"
  strokeWidth="1.5"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  {/* noodle bowl */}
  <ellipse cx="80" cy="80" rx="30" ry="18"/>
  <path d="M50 80 Q55 100 80 104 Q105 100 110 80"/>
  <path d="M62 74 Q70 58 76 74 Q83 58 90 74"/>
  {/* chopsticks */}
  <line x1="125" y1="30" x2="148" y2="95"/>
  <line x1="135" y1="30" x2="156" y2="90"/>
  {/* leaf / herb */}
  <path d="M420 40 Q435 18 460 26 Q448 52 420 40Z"/>
  <line x1="420" y1="40" x2="440" y2="26"/>
  {/* dumpling */}
  <path d="M650 60 Q665 38 688 44 Q697 62 688 82 Q665 88 650 60Z"/>
  <path d="M655 62 Q662 54 670 58"/>
  <path d="M665 44 Q673 42 681 48"/>
  {/* fork */}
  <line x1="740" y1="380" x2="750" y2="440"/>
  <line x1="736" y1="380" x2="736" y2="400"/>
  <line x1="742" y1="380" x2="742" y2="400"/>
  <line x1="748" y1="380" x2="748" y2="400"/>
  {/* sparkle */}
  <line x1="380" y1="300" x2="380" y2="322"/>
  <line x1="369" y1="311" x2="391" y2="311"/>
  <line x1="372" y1="303" x2="388" y2="319"/>
  <line x1="388" y1="303" x2="372" y2="319"/>
  {/* herb bottom-left */}
  <path d="M120 500 Q138 476 158 484 Q144 508 120 500Z"/>
  <line x1="120" y1="500" x2="140" y2="482"/>
  {/* noodle wave */}
  <path d="M530 530 Q548 518 566 530 Q584 542 602 530 Q620 518 638 530"/>
  {/* small bowl */}
  <ellipse cx="310" cy="555" rx="22" ry="13"/>
  <path d="M288 555 Q292 572 310 574 Q328 572 332 555"/>
</svg>
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(ui): add hand-drawn food doodle SVG background texture"
```

---

## Task 4: RestaurantCard Redesign

**Files:**
- Modify: `components/RestaurantCard.tsx`

- [ ] **Step 1: Replace `RestaurantCard.tsx` entirely**

Replace the full file content with:

```tsx
'use client'
import { useState } from 'react'
import { Restaurant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import Link from 'next/link'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
}

function ProximityIcon({ score }: { score: number }) {
  // proximity scale: 1 = far (overseas), 10 = very close (walking distance)
  if (score >= 8) return <span aria-label="步行距離">🦶</span>
  if (score >= 5) return <span aria-label="搭車距離">🚌</span>
  return <span aria-label="開車距離">🚗</span>
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <Card className={`w-full relative overflow-hidden ${isChosen ? 'ring-2 ring-brand' : ''}`}>
      {restaurant.visited && (
        <div className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full border-2 border-brand flex items-center justify-center -rotate-12 shrink-0 z-10">
          <span className="text-[9px] font-black text-brand text-center leading-tight select-none">{'已\n訪'}</span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={restaurant.visited ? 'pr-12' : ''}>
            <CardTitle className="text-base font-bold">{restaurant.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {restaurant.proximity && (
              <div className="flex items-center gap-1 text-brand">
                <ProximityIcon score={restaurant.proximity} />
                <span className="text-sm font-medium">{restaurant.proximity}/10</span>
              </div>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-brand">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{restaurant.rating}</span>
              </div>
            )}
          </div>
        </div>
        {restaurant.mrt_station && (
          <div className="text-xs text-muted-foreground mt-0.5">
            📍 {restaurant.mrt_station}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-2">
          {restaurant.visited ? (
            <Badge className="bg-visited text-visited-foreground border-visited">✓ 已造訪</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">未造訪</Badge>
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
          <p className="text-sm text-muted-foreground italic">{restaurant.review}</p>
        )}
        <div className="flex gap-2 mt-3 items-center">
          {onChoose && (
            <Button
              size="sm"
              onClick={onChoose}
              className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90 font-bold"
            >
              🍜 就選這家！
            </Button>
          )}
          {isChosen && (
            <span className="text-sm text-brand font-medium self-center">✓ 已選擇</span>
          )}
          {onDelete && (
            <Link href={`/restaurants/${restaurant.id}/edit`}>
              <Button variant="ghost" size="sm" className="py-2 px-3 text-sm">
                編輯
              </Button>
            </Link>
          )}
          {onDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="py-2 px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              刪除
            </button>
          )}
          {confirmingDelete && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">確定？</span>
              <button
                onClick={() => { onDelete!(restaurant.id); setConfirmingDelete(false) }}
                className="font-bold text-destructive py-1 px-2"
              >
                是
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-muted-foreground py-1 px-2"
              >
                否
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/RestaurantCard.tsx
git commit -m "feat(ui): redesign RestaurantCard — corner stamp, ProximityIcon emoji, inline delete confirm, token colors"
```

---

## Task 5: Fix Hard-coded Colors in restaurants/page.tsx

**Files:**
- Modify: `app/restaurants/page.tsx`

- [ ] **Step 1: Replace `getFilterButtonClass` and loading state**

Replace the entire file content with:

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
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => { fetchRestaurants() }, [])

  const filtered = restaurants.filter(r => {
    if (tab === '未造訪') return !r.visited
    if (tab === '已造訪') return r.visited
    return true
  })

  const getFilterButtonClass = (target: Tab): string => {
    const active = tab === target
    if (active) return 'bg-brand text-brand-foreground border-brand'
    return 'border-border text-muted-foreground hover:bg-muted'
  }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">餐廳清單</h1>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2"/>
            <div className="h-3 bg-muted rounded w-1/3"/>
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded-full w-16"/>
              <div className="h-5 bg-muted rounded-full w-12"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">餐廳清單</h1>
      <div className="flex gap-2">
        {(['全部', '未造訪', '已造訪'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${getFilterButtonClass(t)}`}
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

Note: `window.confirm()` is removed — delete confirmation now lives in RestaurantCard (Task 4). `handleDelete` no longer calls `confirm()`.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/restaurants/page.tsx
git commit -m "feat(ui): fix hard-coded colors in restaurants page, add skeleton loading, remove window.confirm()"
```

---

## Task 6: Fix Hard-coded Colors in app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Remove inline style and fix heading semantics**

In `app/page.tsx`, make two changes:

1. Replace the Button with inline `style={{ backgroundColor: '#E46C0A', ... }}`:
```tsx
<Button size="lg" className="w-full" style={{ backgroundColor: '#E46C0A', borderColor: '#C0504D', color: '#FFFFFF' }}>🍽️ 我餓了！推薦我</Button>
```
→ with:
```tsx
<Button size="lg" className="w-full bg-brand text-brand-foreground hover:bg-brand/90 font-bold">🍽️ 我餓了！推薦我</Button>
```

2. Replace:
```tsx
<p className="px-4 py-3 text-sm font-semibold border-b bg-muted/30">更新記錄</p>
```
→ with:
```tsx
<h2 className="px-4 py-3 text-sm font-semibold border-b bg-muted/30">更新記錄</h2>
```

- [ ] **Step 2: Update page title to use type scale**

Replace:
```tsx
<h1 className="text-4xl font-bold">美食選擇器</h1>
```
→ with:
```tsx
<h1 className="text-3xl font-black">美食選擇器</h1>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): remove hard-coded orange from home page, fix heading semantics, apply type scale"
```

---

## Task 7: Accessibility Fixes in RestaurantForm and recommend/page

**Files:**
- Modify: `components/RestaurantForm.tsx`
- Modify: `app/recommend/page.tsx`

- [ ] **Step 1: Add aria attributes to range input in `RestaurantForm.tsx`**

Find the `<input type="range" ...>` element and add `aria-label` and `aria-valuetext`:

```tsx
<input
  type="range"
  min={1}
  max={10}
  value={proximity}
  onChange={e => setProximity(Number(e.target.value))}
  className="w-full"
  aria-label="距離範圍"
  aria-valuetext={PROXIMITY_LABELS[proximity]}
/>
```

- [ ] **Step 2: Fix touch targets in `RestaurantForm.tsx`**

Find the rating buttons `w-10 h-10` and change to `w-11 h-11`:
```tsx
className={`w-11 h-11 rounded-full border text-sm font-medium ${
  rating === n ? 'bg-primary text-primary-foreground' : 'border-border'
}`}
```

Find the tag remove button and add padding:
```tsx
<button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70 p-1.5 -mr-1">
  ×
</button>
```
(Also change `X` → `×` for better typography)

- [ ] **Step 3: Add fieldset/legend to visited filter in `recommend/page.tsx`**

In `app/recommend/page.tsx`, find the radio group for visited filter. It will look something like three radio inputs for `all`, `visited`, `unvisited`. Wrap them in:

```tsx
<fieldset>
  <legend className="text-sm font-bold mb-2 text-foreground">造訪狀態篩選</legend>
  {/* existing radio inputs unchanged */}
</fieldset>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/RestaurantForm.tsx app/recommend/page.tsx
git commit -m "fix(a11y): aria-label on range input, touch target sizes, fieldset/legend on radio group"
```

---

## Task 8: Final Build Verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: build completes with no errors. Zero TypeScript errors. CSS compiles cleanly.

- [ ] **Step 2: Check for any remaining hard-coded colors**

```bash
grep -rn "#E46C0A\|#E0E0E0\|text-blue-500\|text-yellow-500\|bg-green-100\|text-green-700\|#F5F5F5\|#4A4A4A\|#666666" app/ components/
```

Expected: no results (all should have been replaced in Tasks 4–6).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete visual system overhaul — warm tokens, Noto Serif TC, food doodle bg, new card design"
```
