# Food Picker — Data Management Improvements
**Date:** 2026-04-20  
**Scope:** Group B — Restaurant editing, tag management, AI summary, visit filter, proximity slider, recommend filters

---

## 1. Data Layer

### DB Migration
```sql
ALTER TABLE restaurants ADD COLUMN ai_summary text;
```
`visit_date` column stays in DB — hidden from UI only.

### TypeScript (`types/index.ts`)
Add to `Restaurant`:
```ts
ai_summary: string | null
```
`visit_date` remains in type but is not rendered anywhere.

### New API Route
`POST /api/restaurants/generate-summary`  
Body: `{ items: string[], review: string | null, tags: string[] }`  
Returns: `{ ai_summary: string }`  
Uses Claude Haiku. Prompt integrates all three inputs into one concise sentence.

### Existing API Updates
- `GET /api/restaurants` — returns `ai_summary`
- `POST /api/restaurants` — accepts `ai_summary`
- `PATCH /api/restaurants/[id]` — accepts `ai_summary`

---

## 2. Restaurant Editing

### New Route
`app/restaurants/[id]/edit/page.tsx`  
- Fetches existing data from `GET /api/restaurants/[id]`  
- Pre-fills RestaurantForm via new `initialData?: Restaurant` prop  
- On submit: calls `PATCH /api/restaurants/[id]`  
- On success: redirects to `/restaurants`

### RestaurantForm changes
- Add `initialData?: Restaurant` prop — when present, form is in edit mode
- All fields pre-populated from `initialData`
- Submit label: "新增餐廳" (create) vs "儲存變更" (edit)

### RestaurantCard changes
- Add "編輯" button linking to `/restaurants/[id]/edit`
- Keep existing "刪除" button

---

## 3. Tag Editing (Form Only)

In RestaurantForm:
- Existing AI-generated tag chips get an `✕` button to remove
- Text input below chips: type a tag + Enter to add manually
- AI "建議標籤" button remains
- Tag state is managed locally in form; submitted with the rest of the form data

---

## 4. AI Summary

In RestaurantForm (both create and edit):
- "生成 AI 摘要" button below the review field
- Calls `POST /api/restaurants/generate-summary` with current form values
- Result fills an editable `textarea` — user can adjust before saving
- Stored in `ai_summary` on submit

In RestaurantCard:
- Display `ai_summary` as a subtitle below the restaurant name (if present)

In Recommendation Engine (`lib/recommendation.ts`):
- Pass `ai_summary` to Claude alongside existing fields — used as the primary restaurant description input
- Proximity is **not** a scoring factor in the engine (removed)

---

## 5. Proximity Slider

Unified across the entire app. Direction: **1 = closest, 10 = farthest**.

| Value | Label |
|-------|-------|
| 1 | 走路 5 分鐘 |
| 2 | 走路 15 分鐘 |
| 3 | 走路 30 分鐘 |
| 4 | 搭車 15 分鐘 |
| 5 | 搭車快一小時 |
| 6 | 搭車一小時以上 |
| 7 | 開車才方便 |
| 8 | 跨縣市 |
| 9 | 台灣另一端 |
| 10 | 出國的 |

The slider shows the current label below the thumb.  
Used in: RestaurantForm (add & edit), Recommend page filter.  
Recommendation engine scoring logic: **not changed in this batch**.

> Note: Current DB/schema has proximity defined as `1=far, 10=close` — this is semantically reversed by the new labeling. No column migration needed, but existing rows will display incorrect labels in the UI until corrected. Fix via SQL: `UPDATE restaurants SET proximity = 11 - proximity WHERE proximity IS NOT NULL;` — run once in Supabase Dashboard after deploying.

---

## 6. Restaurant List — Visited Filter

`app/restaurants/page.tsx`:
- Three tabs at top: **全部 / 未造訪 / 已造訪**
- Client-side filter on the already-fetched list
- No API change needed

---

## 7. Recommend Page — Filters

`app/recommend/page.tsx`:
- Collapsible filter section above the recommend button
- Three filter controls:

| Filter | UI | Default |
|--------|----|---------|
| 已造訪 | Radio: 全部 / 只推未造訪 / 只推已造訪 | 全部 |
| 標籤 | Multi-select chips (fetched from all restaurants) | 無（不限） |
| 距離上限 | Slider 1–10 with labels | 10（不限） |

- Filter values sent in `POST /api/recommend` body
- `RecommendRequest` type extended:
```ts
interface RecommendRequest {
  item?: string
  visited_filter?: 'all' | 'visited' | 'unvisited'
  tags?: string[]
  max_proximity?: number  // exclude restaurants with proximity > this value
}
```
- API route applies filters to restaurant list **before** passing to `getRecommendation()`
- Tags for chips: fetched via `GET /api/restaurants` on page load, deduplicated

---

## Out of Scope (deferred to Group A)

- Confidence score
- Click count in recommendation
- Items + tags weight tuning
- Refresh recommendation batch
- UI beautification (Group C)
- Changelog on homepage (Group C)
