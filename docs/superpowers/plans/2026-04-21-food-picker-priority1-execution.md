# Food Picker Priority-1 UX and Server Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved Priority-1 changes end-to-end: hide items on frontend, make review always visible, move AI summary ownership to server, weaken summary visibility to edit-readonly only, auto-load release notes, and add visited/unvisited left visual-tab status while preserving original card palette.

**Architecture:** Keep database schema unchanged for low risk and compatibility. Move summary generation decisions to API routes (`POST`/`PATCH`) with best-effort execution so CRUD never fails due to model/API instability. Replace hardcoded release imports with build-time generated release index to remain compatible with Next.js 16 + `--webpack` + OpenNext Cloudflare deployment constraints.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase, Anthropic SDK, OpenNext Cloudflare.

---

## File Structure and Responsibilities

- `components/RestaurantForm.tsx`
  - Form rendering and payload assembly.
  - Decouple review visibility from `visited`.
  - Remove items UI and manual summary UI.
- `components/RestaurantCard.tsx`
  - Card-level display policy for list/recommend pages.
  - Hide items and add visited/unvisited left visual-tab styles.
- `app/restaurants/page.tsx`
  - Update top filter buttons to align with new visual-tab status semantics.
- `app/restaurants/[id]/edit/page.tsx`
  - Keep form editable for user fields.
  - Add readonly summary display block.
- `app/api/restaurants/route.ts`
  - Create restaurant.
  - Server-owned summary generation after insert (best-effort).
- `app/api/restaurants/[id]/route.ts`
  - Patch restaurant with field sanitization.
  - Trigger-aware summary regeneration logic.
- `app/api/restaurants/generate-summary/route.ts`
  - Shared summary generation endpoint.
  - Prompt includes visited state and robust error handling.
- `lib/releases.ts`
  - Consumes generated release source, parser fallback and sorting.
- `scripts/generate-releases.ts` (new)
  - Build-time scanner for `docs/releases/*.md`.
  - Emits generated TypeScript module for runtime-safe import.
- `lib/releases.generated.ts` (generated)
  - Auto-created release dataset, never manually edited.
- `package.json`
  - Add prebuild/build hook to run release generator before `next build --webpack`.
- `app/page.tsx`
  - No contract change expected; verify compatibility.
- `types/index.ts`
  - Keep compatibility with hidden-but-retained fields (`items`, `ai_summary`).

---

### Task 1: Baseline Contract Lock and Guardrails

**Files:**
- Modify: `docs/superpowers/plans/2026-04-21-food-picker-priority1-execution.md`
- Verify: `CLAUDE.md`
- Verify: `AGENTS.md`

- [ ] **Step 1: Write baseline checklist as executable acceptance criteria**

```markdown
## Acceptance Baseline
- Review field always visible in create/edit.
- Rating remains visited-only.
- Items are not visible in form/cards but still persisted as array.
- AI summary is not user-editable; server computes best-effort.
- List page hides summary; edit page shows readonly summary.
- Status style changes to left visual tab:
  - Visited: left side solid thick stripe #E46C0A.
  - Unvisited: left side thin stripe #E0E0E0 (or no stripe with left whitespace fallback).
- Release list auto-loads from docs/releases with no manual import edits.
```

- [ ] **Step 2: Run type check to capture pre-change status**

Run:
```bash
npx tsc --noEmit
```
Expected: Either PASS or known pre-existing errors recorded before implementation.

- [ ] **Step 3: Run required build command and capture baseline**

Run:
```bash
npm run build
```
Expected: Build uses `next build --webpack`; output captured for post-change diff.

- [ ] **Step 4: Commit baseline checkpoint**

```bash
git add docs/superpowers/plans/2026-04-21-food-picker-priority1-execution.md
git commit -m "chore: add priority-1 execution baseline and guardrails"
```

---

### Task 2: Restaurant Form Semantics (Review Always Visible, Items Hidden, Manual Summary Removed)

**Files:**
- Modify: `components/RestaurantForm.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Write failing behavior note (manual functional test)**

```text
Current failing behaviors:
1) Review only appears when visited = true.
2) Items input is visible.
3) AI summary generate button and editable textarea are visible.
```

- [ ] **Step 2: Confirm failure states in local UI**

Run:
```bash
npm run dev -- --webpack
```
Expected: You can reproduce all three failing behaviors before code change.

- [ ] **Step 3: Implement minimal form code changes**

```tsx
// 1) Keep `review` state outside visited section and always render review block.
// 2) Keep `rating` rendering under `visited` conditional only.
// 3) Remove items input UI block entirely; preserve `items` state fallback and submit shape.
// 4) Remove aiSummary state, generate-summary button, and editable ai_summary textarea.
// 5) Remove ai_summary from onSubmit payload.
await onSubmit({
  name: name.trim(),
  mrt_station: mrtStation.trim() || null,
  items,
  visited,
  rating: visited ? rating : null,
  review: review.trim() || null,
  proximity,
  tags,
})
```

- [ ] **Step 4: Run static validation**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS, no new type errors from removed summary/item UI state.

- [ ] **Step 5: Commit Task 2**

```bash
git add components/RestaurantForm.tsx
git commit -m "feat: decouple review visibility and remove manual summary/items input UI"
```

---

### Task 3: Edit Page Readonly Summary and List/Card Visibility Policy

**Files:**
- Modify: `app/restaurants/[id]/edit/page.tsx`
- Modify: `components/RestaurantCard.tsx`
- Modify: `app/restaurants/page.tsx` (only if prop wiring needed)

- [ ] **Step 1: Write failing behavior note for visibility policy**

```text
Failing policy before change:
- Edit page does not provide dedicated readonly summary panel.
- Card still shows items badges.
```

- [ ] **Step 2: Implement readonly summary block on edit page**

```tsx
{restaurant.ai_summary && (
  <section className="rounded-lg border bg-muted/30 p-3">
    <p className="text-xs text-muted-foreground mb-1">AI 摘要（唯讀）</p>
    <p className="text-sm leading-6">{restaurant.ai_summary}</p>
  </section>
)}
```

- [ ] **Step 3: Implement RestaurantCard display policy**

```tsx
// Remove items badge map from card content.
// Keep review/tags display.
// Keep summary hidden on list cards.
```

- [ ] **Step 4: Validate routes compile and render**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS with no route/component typing regressions.

- [ ] **Step 5: Commit Task 3**

```bash
git add app/restaurants/[id]/edit/page.tsx components/RestaurantCard.tsx app/restaurants/page.tsx
git commit -m "feat: add readonly summary in edit and enforce card visibility policy"
```

---

### Task 4: Left Visual Tab Status + Filter Button Alignment

**Files:**
- Modify: `components/RestaurantCard.tsx`
- Modify: `app/restaurants/page.tsx`
- Verify: `app/recommend/page.tsx`

- [ ] **Step 1: Write failing visual requirement**

```text
Before change, visited/unvisited cards do not implement left visual tab status stripes.

Before change, top filter buttons do not clearly align with the new status indication.
```

- [ ] **Step 2: Keep existing card palette and add visual-tab container structure**

```tsx
<Card className={`w-full relative ${isChosen ? 'ring-2 ring-primary' : ''}`}>
```

- [ ] **Step 3: Add left visual tab (status stripe) and tune control readability**

```tsx
<div
  aria-hidden
  className={restaurant.visited
    ? 'absolute left-0 top-0 h-full w-2 rounded-l-md bg-[#E46C0A]'
    : 'absolute left-0 top-0 h-full w-[2px] rounded-l-md bg-[#E0E0E0]'}
/>

// Ensure buttons, links, and badges remain readable with existing card colors.
// Keep selected ring and action affordances visually distinct from the status stripe.
```

- [ ] **Step 4: Synchronize top filter button styles with status semantics**

```tsx
// app/restaurants/page.tsx
// Update visited/unvisited/all filter button styles so active state is obvious,
// and visited/unvisited labels visually map to the card status-tab language.
```

- [ ] **Step 5: Manual UI verification (list + recommend)**

Run:
```bash
npm run dev -- --webpack
```
Expected: Card background/border/text colors remain the same as current implementation.

Expected: Left status visual tab renders as visited thick orange stripe and unvisited thin gray stripe (or left whitespace fallback if stripe removed by design review).

Expected: Top filter buttons clearly indicate active state and map to visited/unvisited status meaning.

- [ ] **Step 6: Commit Task 4**

```bash
git add components/RestaurantCard.tsx
git add app/restaurants/page.tsx
git commit -m "feat: add status visual tab and align restaurant filter buttons"
```

---

### Task 5: Server-Owned AI Summary on Create/Patch (Best-Effort, Non-Blocking)

**Files:**
- Modify: `app/api/restaurants/route.ts`
- Modify: `app/api/restaurants/[id]/route.ts`
- Modify: `app/api/restaurants/generate-summary/route.ts`
- Verify: `types/index.ts`

- [ ] **Step 1: Write failing API expectations**

```text
Current API accepts client ai_summary and does not auto-regenerate on patch triggers.
Expected:
- POST ignores client ai_summary and server-generates summary.
- PATCH ignores client ai_summary and conditionally regenerates on review/tags/visited/items changes.
- Summary failure must not fail create/update.
```

- [ ] **Step 2: Implement shared summary helper usage with visited-aware prompt**

```ts
// generate-summary route input
const { items, review, tags, visited } = await req.json()

// visited-aware prompt segment
const visitedPart = visited ? '此店家已造訪。' : '此店家尚未造訪。'
```

- [ ] **Step 3: Implement POST best-effort summary ownership**

```ts
// app/api/restaurants/route.ts
// 1) sanitize insert payload: ignore body.ai_summary
// 2) insert row first
// 3) try generate summary and update ai_summary
// 4) if generation fails, log error and return created row anyway
```

- [ ] **Step 4: Implement PATCH trigger-aware regeneration**

```ts
// app/api/restaurants/[id]/route.ts
// 1) fetch existing row
// 2) sanitize body to exclude ai_summary
// 3) detect changed keys among review/tags/visited/items
// 4) update base fields
// 5) if trigger changed, try regenerate summary and writeback
// 6) never fail PATCH due to summary failure
```

- [ ] **Step 5: Validate API and types compile**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS with route types and request payload handling intact.

- [ ] **Step 6: Commit Task 5**

```bash
git add app/api/restaurants/route.ts app/api/restaurants/[id]/route.ts app/api/restaurants/generate-summary/route.ts types/index.ts
git commit -m "feat: make ai summary server-owned with trigger-aware best-effort regeneration"
```

---

### Task 6: Release Notes Auto-Loading (Remove Hardcoded Imports)

**Files:**
- Create: `scripts/generate-releases.ts`
- Create: `lib/releases.generated.ts`
- Modify: `lib/releases.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing release workflow expectation**

```text
Current behavior requires manual import edits in lib/releases.ts for each new markdown release.
Expected behavior: adding docs/releases/YYYY-MM-DD-x.md is auto-reflected after build without source import edits.
```

- [ ] **Step 2: Implement generator script**

```ts
// scripts/generate-releases.ts
import fs from 'node:fs'
import path from 'node:path'

const releasesDir = path.join(process.cwd(), 'docs', 'releases')
const output = path.join(process.cwd(), 'lib', 'releases.generated.ts')

const files = fs.readdirSync(releasesDir)
  .filter((f) => f.endsWith('.md'))
  .sort((a, b) => b.localeCompare(a))

const entries = files.map((filename) => {
  const fullPath = path.join(releasesDir, filename)
  const content = fs.readFileSync(fullPath, 'utf8')
  return { filename, content }
})

const source = `export interface GeneratedRelease { filename: string; content: string }\n` +
  `export const generatedReleases: GeneratedRelease[] = ${JSON.stringify(entries, null, 2)}\n`

fs.writeFileSync(output, source, 'utf8')
```

- [ ] **Step 3: Refactor release module to consume generated array**

```ts
// lib/releases.ts
import { generatedReleases } from './releases.generated'

export const RELEASE_LIMIT = 3
export const releases = [...generatedReleases]
  .sort((a, b) => b.filename.localeCompare(a.filename))
  .slice(0, RELEASE_LIMIT)
```

- [ ] **Step 4: Wire generator to build lifecycle**

```json
{
  "scripts": {
    "generate:releases": "tsx scripts/generate-releases.ts",
    "build": "npm run generate:releases && next build --webpack"
  }
}
```

- [ ] **Step 5: Build verification**

Run:
```bash
npm run build
```
Expected: Release generator runs first; build succeeds under webpack mode.

- [ ] **Step 6: Commit Task 6**

```bash
git add scripts/generate-releases.ts lib/releases.generated.ts lib/releases.ts package.json
git commit -m "feat: auto-load release markdown via build-time generated index"
```

---

### Task 7: Cross-Flow Regression Verification and Hardening

**Files:**
- Verify: `app/restaurants/new/page.tsx`
- Verify: `app/restaurants/[id]/edit/page.tsx`
- Verify: `app/restaurants/page.tsx`
- Verify: `app/recommend/page.tsx`
- Verify: `lib/recommendation.ts`

- [ ] **Step 1: Run static + build checks**

Run:
```bash
npx tsc --noEmit
npm run build
```
Expected: Both commands PASS.

- [ ] **Step 2: Execute manual functional matrix**

```text
A. Create unvisited restaurant:
- Review visible and editable.
- No items input visible.
- No manual summary UI.

B. Edit restaurant:
- Toggling visited does not clear review.
- Summary shown as readonly block only.

C. List and recommend:
- Summary/items hidden in cards.
- Card palette stays unchanged from baseline.
- Left status visual tab is present and correct for both visited/unvisited.

F. Filter buttons:
- Top filter buttons reflect active state clearly and align with visited/unvisited status semantics.

D. API behavior:
- Summary generation failure does not block create/update.
- PATCH unrelated field does not force summary regeneration.

E. Release:
- Add new markdown file under docs/releases.
- Rebuild and verify homepage shows new release without import edits.
```

- [ ] **Step 3: Record residual risks and mitigations in docs**

```markdown
## Residual Risks
- Summary generation latency can increase write response time.
- Anthropic transient failures leave ai_summary unchanged/null.

## Mitigations
- Best-effort non-blocking summary policy retained.
- Future enhancement: async retry queue if p95 latency exceeds target.
```

- [ ] **Step 4: Commit verification checkpoint**

```bash
git add app docs/superpowers/plans/2026-04-21-food-picker-priority1-execution.md
git commit -m "test: verify priority-1 regression matrix and document residual risks"
```

---

## Self-Review

### 1) Spec Coverage Check

- Review always visible and not visited-controlled: covered in Task 2.
- Items hidden in frontend, data compatibility retained: covered in Task 2 + Task 3.
- AI summary server-owned and not manually editable: covered in Task 2 + Task 5.
- Summary hidden in list/form, readonly in edit: covered in Task 3.
- Summary prompt includes visited: covered in Task 5.
- Release hardcoded imports removed: covered in Task 6.
- Visited/unvisited visual tab and filter button alignment: covered in Task 4.
- Validation matrix and build/type checks: covered in Task 7.

No uncovered requirement found.

### 2) Placeholder Scan

- No TBD/TODO placeholders.
- Every task includes exact files, executable commands, expected results, and concrete code snippets.

### 3) Type and Contract Consistency

- `ai_summary` ownership is consistently server-side in Task 2/5.
- Trigger fields for regeneration consistently defined as review/tags/visited/items.
- Release data contract (`filename`, `content`) kept stable for `app/page.tsx` consumption.

No naming or contract contradictions found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-21-food-picker-priority1-execution.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
