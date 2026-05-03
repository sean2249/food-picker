import Link from 'next/link'
import { releases, parseReleaseTitle, parseReleaseDate, parseReleaseSections } from '@/lib/releases'

export default function Home() {
  const today = new Date()
  const monthDay = `${today.getMonth() + 1}.${String(today.getDate()).padStart(2, '0')}`
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]

  return (
    <div className="zakka-content space-y-10 pt-6">
      {/* Date stamp — handwritten journal feel; foreground/65 keeps it
          legible on the patterned bg without screaming for attention */}
      <div className="flex items-center justify-center gap-3 text-foreground/65">
        <span className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em]">
          <span className="h-px w-6 bg-foreground/25" />
          <span>今日 · {monthDay} 星期{weekday}</span>
          <span className="h-px w-6 bg-foreground/25" />
        </span>
      </div>

      {/* Hero — tiramisu + title + tagline */}
      <section className="text-center space-y-6">
        <Tiramisu />
        <div className="space-y-2">
          <h1 className="text-[2.6rem] leading-[1.05] tracking-tight">
            美食選擇器
          </h1>
          <p className="text-base text-muted-foreground">
            餓了別煩惱，交給命運這一碗
          </p>
        </div>

        {/* Primary CTA — pudding bounce on press, never on hover */}
        <div className="pt-2 space-y-3 max-w-xs mx-auto">
          <Link
            href="/recommend"
            className="pudding-press group relative block w-full rounded-full bg-brand text-brand-foreground
                       px-6 py-4 text-lg shadow-[0_6px_0_-1px_oklch(0.40_0.140_45)]
                       hover:shadow-[0_5px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                       active:translate-y-1 active:shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]
                       transition-[transform,box-shadow] duration-150 ease-out
                       focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-2">
              <SparkBowl />
              <span>我餓了！推薦我</span>
            </span>
          </Link>

          <Link
            href="/restaurants/new"
            className="block w-full rounded-full border border-border bg-card/60 backdrop-blur-[1px]
                       px-6 py-3 text-base text-foreground
                       hover:bg-card hover:border-foreground/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-2">
              <PlusLeaf />
              <span>新增一間餐廳</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Updates — journal entry block; bumped to 90% card opacity for
          comfortable reading over the patterned bg */}
      <section aria-labelledby="updates-heading" className="rounded-2xl bg-card/90 border border-border/80 overflow-hidden shadow-[0_1px_2px_oklch(0.30_0.04_50_/_0.06)]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-dashed border-border">
          <h2 id="updates-heading" className="text-sm text-foreground inline-flex items-center gap-2">
            <BookmarkDot />
            <span>更新記錄</span>
          </h2>
          <span className="text-[11px] text-muted-foreground tracking-wider">
            最近 {releases.length} 篇
          </span>
        </header>
        <ul>
          {releases.map((release, i) => (
            <li key={release.filename} className="border-b border-dashed border-border/70 last:border-0">
              <details open={i === 0} className="group">
                <summary className="px-5 py-3 cursor-pointer list-none flex items-center justify-between gap-3
                                    hover:bg-muted/50 transition-colors">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-brand text-base leading-none transition-transform group-open:rotate-90">›</span>
                    <span className="truncate">{parseReleaseTitle(release.content)}</span>
                  </span>
                  {parseReleaseDate(release.content) && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {parseReleaseDate(release.content)}
                    </span>
                  )}
                </summary>
                <ul className="px-5 pb-4 pt-1 space-y-1.5">
                  {parseReleaseSections(release.content).map((section) => (
                    <li
                      key={section}
                      className="text-sm text-muted-foreground flex items-start gap-2 pl-7"
                    >
                      <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-brand/60 shrink-0" />
                      <span>{section}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// — Hero illustration: tiramisu block (cocoa-cream-coffee layers) + sparkles.
//   Tiramisu is cold dessert, so steam → sparkles for the "fresh treat" cue. —
function Tiramisu() {
  return (
    <div className="relative mx-auto h-32 w-32" aria-hidden>
      {/* Sparkles around the cake — three twinkles offset in time */}
      <svg
        className="absolute -inset-3 h-[152px] w-[152px]"
        viewBox="0 0 152 152" fill="none"
        stroke="oklch(0.625 0.175 45 / 0.85)" strokeWidth="1.6" strokeLinecap="round"
      >
        <g className="sparkle-twinkle" style={{ animationDelay: '0s', transformOrigin: '20px 30px' }}>
          <line x1="20" y1="24" x2="20" y2="36" />
          <line x1="14" y1="30" x2="26" y2="30" />
        </g>
        <g className="sparkle-twinkle" style={{ animationDelay: '0.9s', transformOrigin: '128px 22px' }}>
          <line x1="128" y1="14" x2="128" y2="30" />
          <line x1="120" y1="22" x2="136" y2="22" />
        </g>
        <g className="sparkle-twinkle" style={{ animationDelay: '1.7s', transformOrigin: '132px 110px' }}>
          <line x1="132" y1="104" x2="132" y2="116" />
          <line x1="126" y1="110" x2="138" y2="110" />
        </g>
      </svg>

      {/* Tiramisu body — slightly tilted hand-drawn block */}
      <svg
        viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <clipPath id="tira-body">
            <rect x="20" y="30" width="88" height="80" rx="13" ry="15" />
          </clipPath>
        </defs>

        <g transform="rotate(-2.5 64 70)">
          {/* Layered fills clipped to the cake silhouette */}
          <g clipPath="url(#tira-body)">
            {/* Cocoa dust top */}
            <rect x="20" y="30" width="88" height="20" fill="oklch(0.36 0.07 55)" />
            {/* Mascarpone cream */}
            <rect x="20" y="50" width="88" height="14" fill="oklch(0.93 0.035 80)" />
            {/* Coffee-soaked sponge */}
            <rect x="20" y="64" width="88" height="14" fill="oklch(0.60 0.085 55)" />
            {/* Mascarpone cream */}
            <rect x="20" y="78" width="88" height="14" fill="oklch(0.93 0.035 80)" />
            {/* Sponge bottom */}
            <rect x="20" y="92" width="88" height="18" fill="oklch(0.60 0.085 55)" />
          </g>

          {/* Outline */}
          <rect x="20" y="30" width="88" height="80" rx="13" ry="15"
                fill="none" stroke="oklch(0.30 0.04 50)" strokeWidth="2.2" strokeLinejoin="round" />

          {/* Cocoa powder dusting on top band */}
          <circle cx="32" cy="36" r="0.9" fill="oklch(0.18 0.04 50 / 0.55)" />
          <circle cx="44" cy="34" r="1.4" fill="oklch(0.18 0.04 50 / 0.55)" />
          <circle cx="56" cy="38" r="0.9" fill="oklch(0.18 0.04 50 / 0.55)" />
          <circle cx="80" cy="34" r="1.2" fill="oklch(0.18 0.04 50 / 0.55)" />
          <circle cx="92" cy="38" r="1" fill="oklch(0.18 0.04 50 / 0.55)" />
          <circle cx="100" cy="35" r="0.7" fill="oklch(0.18 0.04 50 / 0.55)" />

          {/* Coffee bean garnish — sits on top, slight tilt */}
          <g transform="rotate(-22 68 38)">
            <ellipse cx="68" cy="38" rx="5" ry="3.2"
                     fill="oklch(0.32 0.05 50)"
                     stroke="oklch(0.20 0.04 50)" strokeWidth="0.8" />
            <path d="M64 38 Q68 36 72 38 M64 38 Q68 40 72 38"
                  stroke="oklch(0.18 0.04 50)" strokeWidth="0.8" fill="none" />
          </g>

          {/* Face on the lower cream layer — soft, sleepy-cute */}
          <ellipse cx="50" cy="84" rx="3" ry="3.4" fill="oklch(0.20 0.04 50)" />
          <ellipse cx="78" cy="84" rx="3" ry="3.4" fill="oklch(0.20 0.04 50)" />
          {/* Eye highlights */}
          <circle cx="51" cy="83" r="0.9" fill="oklch(0.985 0.012 76)" />
          <circle cx="79" cy="83" r="0.9" fill="oklch(0.985 0.012 76)" />
          {/* Cheeks on lower sponge */}
          <ellipse cx="40" cy="98" rx="3.4" ry="2.2" fill="oklch(0.78 0.10 30 / 0.55)" />
          <ellipse cx="88" cy="98" rx="3.4" ry="2.2" fill="oklch(0.78 0.10 30 / 0.55)" />
          {/* Mouth — small smile */}
          <path d="M60 96 Q64 99 68 96"
                stroke="oklch(0.20 0.04 50)" strokeWidth="1.4"
                strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  )
}

// — Bowl + sparkle, used inside primary CTA —
function SparkBowl() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden>
      <path d="M3 12h18" />
      <path d="M4 12a8 8 0 0 0 16 0" />
      <path d="M9 6c0-1 1-2 1.5-2S11 5 11 6" />
      <path d="M13 5c.5-1 1.4-1.6 2-1.4S15.6 5 15 6" />
      <path d="M19 17l.6 1.6L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.4Z" />
    </svg>
  )
}

// — Plus-with-leaf, used inside secondary CTA —
function PlusLeaf() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden>
      <path d="M12 5v14M5 12h14" />
      <path d="M16 6c2-1 4 1 3 3" stroke="oklch(0.55 0.10 130)" />
    </svg>
  )
}

// — Notebook bookmark dot, used in updates header —
function BookmarkDot() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden>
      <path d="M2 1.5h10v12l-5-3-5 3v-12Z"
            fill="oklch(0.625 0.175 45 / 0.18)"
            stroke="oklch(0.625 0.175 45)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
