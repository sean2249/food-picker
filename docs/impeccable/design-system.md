# Design System

Concrete tokens and patterns for the food-picker UI. The *what*, paired with `.impeccable.md`'s *why* and *constraints*. When implementing or editing any surface, read both.

> Last captured: 2026-05-03. Treat token values as the canonical source — code may drift, this file shouldn't.

## Surfaces & Color

All colors are **OKLCH**. Never write `#hex` or `hsl()` in new code; convert first.

| Token | Value | Used for |
|---|---|---|
| `--background` | `oklch(0.965 0.014 76)` | Linen body, warm off-white |
| `--card` | `oklch(0.985 0.012 76)` | Lifted surfaces (use at `/90` opacity over patterned bg) |
| `--muted` | `oklch(0.935 0.018 72)` | Ghost row hover, pill backgrounds |
| `--nav-bg` | `oklch(0.955 0.020 72)` | Header strip — slightly warmer than body |
| `--foreground` | `oklch(0.215 0.030 50)` | Brewed-tea brown ink |
| `--muted-foreground` | `oklch(0.500 0.034 55)` | Decorative text only — see Constraints |
| `--brand` | `oklch(0.625 0.175 45)` | The single CTA orange (`#E46C0A`) |
| `--matcha` | `oklch(0.640 0.105 130)` | Reserved for vegetable / health tags |
| `--azuki` | `oklch(0.520 0.130 25)` | Reserved for dessert / 療癒 tags |
| `--border` | `oklch(0.870 0.024 68)` | Soft paper-edge dividers |
| `--ring` | `var(--brand)` | Focus ring (`outline: 2px solid; offset: 3px`) |
| `--radius` | `0.875rem` | Base for `--radius-sm/md/lg/xl/2xl/3xl/4xl` ladder |

Default to `xl` and above for cards — small radii read corporate.

## Paper Background

Three stacked layers form the surface; never replace one without touching the others.

1. `body` color — `--background`, the warm linen tint
2. `.zakka-paper::before` — `/zakka-background.png` tile
   - `background-size`: 340px desktop, 380px ≤640px
   - `opacity`: 0.18 desktop, 0.15 ≤640px (hard cap; see Constraints)
   - `mix-blend-mode: multiply`
3. `.zakka-paper::after` — radial-gradient grain at 0.03–0.04 opacity

**Reading veil — `.zakka-content`:** wraps a content column with a soft warm wash (`oklch(0.97 0.013 76 / 0.78)`, rounded 24/28px, inset -8/-16px mobile, -12/-32px ≥720px). Apply to every page wrapper that has body text on `zakka-paper`.

## Typography

**jf-openhuninn 2.1 (粉圓)** — single typeface, single weight. Loaded via `next/font/local` from `public/fonts/jf-openhuninn-2.1.ttf`, exposed as `--font-zakka`, drives both `--font-sans` and `--font-heading`.

**Hierarchy:**
- Hero title: `text-[2.6rem] leading-[1.05] tracking-tight`
- Section heading: `text-sm` with bookmark/dot icon prefix
- Body primary: `text-foreground`
- Body on patterned bg: `text-foreground/75` minimum
- Microcopy: `text-xs tracking-[0.08em]`
- Date stamps: short tracked text framed by hairline rules

## Iconography & Brand Mark

**Brand mark: tiramisu** — layered cocoa-cream-coffee block.

- **Hero variant** — 128×128 viewBox, tilted -2.5°, includes face (eyes + cheeks + smile), coffee-bean garnish, cocoa dust dots, three sparkles
- **Mini variant** — 24×24 viewBox in a 32×32 brand-tinted rounded square. Strips face + coffee bean; layered stripes carry the identity at small size

**Style rules:**
- Inline SVG only, hand-drawn feel: `strokeLinecap="round"`, `strokeLinejoin="round"`, varied stroke weights
- Functional UI icons (close, chevron) may use simple stroke shapes but should still favor brushy lines
- Icons in CTAs use `currentColor` so they inherit button text color

## Motion

Easing tokens in `:root`:

| Token | Curve | Use |
|---|---|---|
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Default deceleration for state changes |
| `--ease-pudding` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Press-only overshoot |

**Named animations:**
- `pudding-bounce` (360ms) — squash-and-stretch on `:active` only via `.pudding-press`
- `sparkle-twinkle` (2.4s, infinite) — opacity + scale pulse for SVG sparkle accents; stagger `animationDelay` per element

**Hard rules:**
- Animate `transform` / `opacity` only — never width/height/padding/margin
- Use `grid-template-rows: 0fr → 1fr` for collapsing/expanding height
- Motion ≤400ms unless looping
- Every animation respects `@media (prefers-reduced-motion: reduce)` — turn off, don't slow

## Layout & Components

**Page shell** — `max-w-2xl mx-auto px-4 py-8` content column, `<body class="zakka-paper">`, sticky `<NavBar />` with `z-30 backdrop-blur-sm`. New pages opt into `.zakka-content` on their root wrapper.

**Navigation** — brand mark + wordmark on the left (always visible). `≥sm`: inline nav links on the right (primary as filled brand pill, others as ghost text-links with brand-color underline when active). `<sm`: hamburger button + slide-down panel. Panel uses `grid-template-rows` for animation, `tabIndex={-1}` on hidden links, closes on Esc / route change / click-outside. Hamburger icon is three brush-stroke `<span>` bars that morph to X.

**Primary CTA** — rounded-full pill, `px-6 py-4 text-lg`. Stacked shadow for press depth: `shadow-[0_6px_0_-1px_oklch(0.40_0.140_45)]` resting → 5px on hover → 2px on `:active`, combined with `active:translate-y-1`. `.pudding-press` for the squish. Always paired with a ghost outline secondary action below.

**Secondary action** — `rounded-full border border-border bg-card/60`, smaller padding, base font size.

**Cards** — `bg-card/90` minimum opacity over patterned bg. `border-border/80`. Use **dashed** borders for internal dividers (journal feel).

**List items in cards** — small brand-color dots (`h-1 w-1 rounded-full bg-brand/60`) as bullets. Toggle indicators: a `›` that rotates 90° on `group-open`.

## Anti-patterns

In addition to impeccable's global absolute_bans (no left-border stripes, no gradient text), this project also forbids:

- Serif fonts on any surface
- Icon-library imports on brand surfaces (hero, brand mark, decorative)
- Fully-saturated `bg-card` — always `/90` or lighter
- `text-muted-foreground` on patterned bg for important text — use `text-foreground/75`
- Bouncing on hover (pudding-bounce is press-only)

## Asset Index

| Asset | Path | Wired in |
|---|---|---|
| Body font | `public/fonts/jf-openhuninn-2.1.ttf` | [app/layout.tsx](../../app/layout.tsx) |
| Bg pattern | `public/zakka-background.png` | [app/globals.css](../../app/globals.css) (`.zakka-paper::before`) |
| Brand mark (mini) | inline SVG | [components/NavBar.tsx](../../components/NavBar.tsx) `<BrandMark />` |
| Brand mark (hero) | inline SVG | [app/page.tsx](../../app/page.tsx) `<Tiramisu />` |
| Original mockups | `docs/impeccable/ref/Gemini_Generated_Image_*.png` | — |
| Design vision | `docs/impeccable/ref/design.md` | — |
