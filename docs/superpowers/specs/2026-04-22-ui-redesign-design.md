# UI Redesign — Design Spec
**Date:** 2026-04-22  
**Scope:** Full visual system overhaul (Direction 2)  
**Goal:** Transform food-picker from an AI-looking generic SaaS app into a warm, playful, handmade-feeling personal food notebook.

---

## Design Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Visual direction | C · 活潑在地 — bold, expressive, street-food energy |
| Background texture | C · 食材線稿 — faint hand-drawn food ingredient SVG doodles |
| Typography | B · Noto Serif TC — old recipe book warmth, heritage feel |
| Card visited state | B · 角落橡皮章 — circular corner stamp "已訪", rotated slightly |

---

## 1. Color System

### Principle
All colors defined as CSS custom properties in `globals.css` only. No hard-coded hex values anywhere in components. Brand orange `#E46C0A` enters the system as `--brand`.

### Token Definitions (`app/globals.css` `:root` block)

```css
:root {
  /* Backgrounds — warm, never pure white */
  --background:             oklch(0.980 0.010 72);   /* warm off-white, like aged paper */
  --card:                   oklch(0.995 0.008 72);   /* cards slightly lighter than bg */
  --muted:                  oklch(0.945 0.012 70);   /* inputs, secondary zones */

  /* Text — warm browns, not pure black */
  --foreground:             oklch(0.180 0.025 55);   /* deep warm brown */
  --muted-foreground:       oklch(0.520 0.030 60);   /* secondary text */

  /* Brand orange — single source of truth */
  --brand:                  oklch(0.580 0.165 48);   /* #E46C0A expressed in OKLCH */
  --brand-foreground:       oklch(0.995 0 0);        /* white text on orange */

  /* Visited state */
  --visited:                oklch(0.870 0.060 48);   /* warm amber card tint */
  --visited-foreground:     oklch(0.420 0.120 48);   /* deep orange text */

  /* Borders */
  --border:                 oklch(0.880 0.018 68);   /* warm border */
  --input:                  oklch(0.880 0.018 68);

  /* System */
  --ring:                   oklch(0.580 0.165 48);   /* focus ring = brand orange */
  --radius:                 0.75rem;
}
```

### Tailwind Theme (`globals.css` `@theme inline` block)
Add to the existing `@theme inline` block:
```css
--color-brand:            var(--brand);
--color-brand-foreground: var(--brand-foreground);
--color-visited:          var(--visited);
--color-visited-foreground: var(--visited-foreground);
```

### Migration: Hard-coded Colors to Remove

| Location | Old value | New Tailwind class |
|---|---|---|
| `RestaurantCard.tsx` | `bg-[#E46C0A]` (stripe) | Remove entirely (stripe banned) |
| `RestaurantCard.tsx` | `bg-[#E0E0E0]` (stripe) | Remove entirely |
| `RestaurantCard.tsx` | `text-blue-500` (proximity) | `text-brand` |
| `RestaurantCard.tsx` | `text-yellow-500` (star) | `text-brand` |
| `RestaurantCard.tsx` | `bg-green-100 text-green-700` (visited badge) | `bg-visited text-visited-foreground` |
| `restaurants/page.tsx` | `bg-[#E46C0A]` | `bg-brand` |
| `restaurants/page.tsx` | inline `#F5F5F5`, `#4A4A4A`, `#666666` | Tailwind token equivalents |
| `page.tsx` | `style={{ backgroundColor: '#E46C0A' }}` | `className="bg-brand text-brand-foreground"` |

---

## 2. Typography System

### Font: Noto Serif TC

Load in `app/layout.tsx`:
```tsx
import { Noto_Serif_TC } from 'next/font/google'

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
})
```

Apply variable and className to `<html>` tag:
```tsx
<html lang="zh-TW" className={notoSerifTC.variable}>
```
This injects the CSS variable `--font-serif` into the document, which the `@theme inline` rule then maps to `--font-sans` for Tailwind.

In `globals.css` `@theme inline`:
```css
--font-sans: var(--font-serif);
```

Remove: Inter/Geist font imports from `layout.tsx`.

### Type Scale

| Element | Class | Weight |
|---|---|---|
| Page title (美食選擇器) | `text-3xl` | `font-black` (900) |
| Card restaurant name | `text-base` | `font-bold` (700) |
| Button labels | `text-sm` | `font-bold` (700) |
| Body / review text | `text-sm` | `font-normal` (400), `italic` |
| Secondary / meta | `text-xs` | `font-normal` (400) |

---

## 3. RestaurantCard Redesign

### Remove
- The absolute-positioned side stripe (`w-2 bg-[#E46C0A]` / `w-[2px] bg-[#E0E0E0]`) — entirely.
- `Navigation` icon from lucide-react.

### Visited State: Corner Rubber Stamp
When `restaurant.visited === true`, render a circular stamp in the top-right corner:

```tsx
{restaurant.visited && (
  <div className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full border-2 border-brand flex items-center justify-center -rotate-12 shrink-0">
    <span className="text-[9px] font-black text-brand text-center leading-tight">已{"\n"}訪</span>
  </div>
)}
```

### Proximity Icon
Replace `<Navigation>` with a function that returns emoji based on score:

```tsx
function ProximityIcon({ score }: { score: number }) {
  // proximity scale: 1 = far (out of country), 10 = very close (walking)
  if (score >= 8) return <span aria-label="步行距離">🦶</span>
  if (score >= 5) return <span aria-label="搭車距離">🚌</span>
  return <span aria-label="開車距離">🚗</span>
}
```

> Note: proximity 1 = far away (overseas), 10 = very close (walking). High score = walk, low score = drive.

Display: `<ProximityIcon score={restaurant.proximity} /> {restaurant.proximity}/10`

### Button Hierarchy in Card

| Button | Style |
|---|---|
| 就選這家！ | `bg-brand text-brand-foreground` (primary, full-width) |
| 編輯 | `variant="ghost" size="sm"` (secondary) |
| 刪除 (default state) | `text-sm text-muted-foreground` plain text button |
| 刪除 (confirming state) | inline "確定刪除？ [是] [否]" |

### Delete Confirmation (inline, no `window.confirm()`)

Add local state `confirmingDelete: boolean` to RestaurantCard.

```tsx
const [confirmingDelete, setConfirmingDelete] = useState(false)

// Render:
{onDelete && !confirmingDelete && (
  <button onClick={() => setConfirmingDelete(true)} className="text-sm text-muted-foreground hover:text-destructive">
    刪除
  </button>
)}
{confirmingDelete && (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">確定刪除？</span>
    <button onClick={() => { onDelete(restaurant.id); setConfirmingDelete(false) }} className="font-bold text-destructive">是</button>
    <button onClick={() => setConfirmingDelete(false)} className="text-muted-foreground">否</button>
  </div>
)}
```

---

## 4. Background Texture

### Implementation
Inline SVG in `app/layout.tsx` body, position fixed, pointer-events none, z-index -1, opacity 10%.

The SVG contains scattered hand-drawn food ingredient linework: noodle bowl, chopsticks, dumpling, leaf/herb, fork, sparkle/star, wave noodles. Stroke color: `#C4650A` (warm orange). No fills.

```tsx
// In layout.tsx, inside <body>, before {children}:
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
  {/* bowl */}
  <ellipse cx="80" cy="80" rx="30" ry="18"/>
  <path d="M50 80 Q55 100 80 104 Q105 100 110 80"/>
  <path d="M62 74 Q70 58 76 74 Q83 58 90 74"/>
  {/* chopsticks */}
  <line x1="125" y1="30" x2="148" y2="95"/>
  <line x1="135" y1="30" x2="156" y2="90"/>
  {/* leaf */}
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

---

## 5. Interactions & Accessibility

### 5a — Focus Indicator (global)
In `app/globals.css`:
```css
*:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 5b — Touch Targets
All interactive elements must be ≥44×44px on mobile:
- Edit/delete buttons in RestaurantCard: add `py-2 px-3`
- Rating star buttons in RestaurantForm: `w-11 h-11` (currently `w-10 h-10`)
- Tag remove × button: `p-1.5`

### 5c — Radio Group Accessibility (recommend/page.tsx)
Wrap the visited filter radio inputs in:
```tsx
<fieldset>
  <legend className="text-sm font-bold mb-2">造訪狀態篩選</legend>
  {/* radio inputs */}
</fieldset>
```

### 5d — Range Input Label (RestaurantForm.tsx)
Add `aria-label` and `aria-valuetext` to the proximity range input:
```tsx
<input
  type="range"
  aria-label="距離範圍"
  aria-valuetext={PROXIMITY_LABELS[proximity]}
  ...
/>
```

### 5e — Loading Skeleton (restaurants/page.tsx)
Replace `<p>載入中...</p>` with:
```tsx
{[1,2,3].map(i => (
  <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
    <div className="h-4 bg-muted rounded w-1/2"/>
    <div className="h-3 bg-muted rounded w-1/3"/>
    <div className="flex gap-2">
      <div className="h-5 bg-muted rounded-full w-16"/>
      <div className="h-5 bg-muted rounded-full w-12"/>
    </div>
  </div>
))}
```

### 5f — Heading Semantics (page.tsx)
Replace `<p className="...">更新記錄</p>` with `<h2 className="...">更新記錄</h2>`.

---

## 6. Out of Scope

The following audit findings are intentionally deferred:
- Dark mode support (no requirement)
- iOS range slider custom styling (low impact, low traffic)
- Empty state CTAs (can follow in a separate pass)
- AI summary display (commented out, leave as-is)

---

## Files to Modify

| File | Changes |
|---|---|
| `app/globals.css` | New color tokens, amber chroma, focus-visible rule |
| `app/layout.tsx` | Noto Serif TC font, remove Inter/Geist, add SVG background |
| `app/page.tsx` | Remove inline style, use `bg-brand`, fix `<p>` → `<h2>` |
| `components/RestaurantCard.tsx` | Remove stripe, add stamp, ProximityIcon, inline delete confirm, button hierarchy |
| `components/RestaurantForm.tsx` | aria attrs on range, touch target fixes |
| `app/restaurants/page.tsx` | Remove hard-coded colors, loading skeleton, fix button tokens |
| `app/recommend/page.tsx` | fieldset/legend on radio group |
