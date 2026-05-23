import Image from 'next/image'
import Link from 'next/link'

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

        {/* Primary CTAs — food + coffee, two pudding-press buttons side by side */}
        <div className="pt-2 space-y-3 max-w-sm mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/restaurants/recommend"
              className="pudding-press group relative block w-full rounded-full bg-brand text-brand-foreground
                         px-4 py-3.5 text-base shadow-[0_6px_0_-1px_oklch(0.40_0.140_45)]
                         hover:shadow-[0_5px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                         active:translate-y-1 active:shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]
                         transition-[transform,box-shadow] duration-150 ease-out
                         focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <SparkBowl />
                <span>推薦我吃</span>
              </span>
            </Link>

            <Link
              href="/cafes/recommend"
              className="pudding-press group relative block w-full rounded-full bg-brand text-brand-foreground
                         px-4 py-3.5 text-base shadow-[0_6px_0_-1px_oklch(0.40_0.140_45)]
                         hover:shadow-[0_5px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                         active:translate-y-1 active:shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]
                         transition-[transform,box-shadow] duration-150 ease-out
                         focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <SparkCup />
                <span>推薦我喝</span>
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/restaurants/new"
              className="block w-full rounded-full border border-border bg-card/60 backdrop-blur-[1px]
                         px-4 py-2.5 text-sm text-foreground
                         hover:bg-card hover:border-foreground/20 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PlusLeaf />
                <span>新增餐廳</span>
              </span>
            </Link>
            <Link
              href="/cafes/new"
              className="block w-full rounded-full border border-border bg-card/60 backdrop-blur-[1px]
                         px-4 py-2.5 text-sm text-foreground
                         hover:bg-card hover:border-foreground/20 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PlusLeaf />
                <span>新增咖啡店</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// — Hero illustration: the painterly tiramisu mascot mid-wink, with its
//   own built-in sparkles (so no SVG overlay needed). —
function Tiramisu() {
  return (
    <div className="relative mx-auto" aria-hidden>
      <Image
        src="/mascot/hero.png"
        alt=""
        width={600}
        height={400}
        priority
        className="mx-auto block h-auto w-[15rem] sm:w-[17rem]"
        draggable={false}
      />
    </div>
  )
}

// — Bowl + sparkle, used inside food recommend CTA —
function SparkBowl() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
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

// — Coffee cup + sparkle, used inside coffee recommend CTA —
function SparkCup() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden>
      <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 5c0 1 0 1.5-.5 2.2M11 5c0 1 0 1.5-.5 2.2M14 5c0 1 0 1.5-.5 2.2" />
      <path d="M19 18l.6 1.6L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.4Z" />
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

