'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Restaurant } from '@/types'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <article
      className={[
        'relative rounded-2xl bg-card/90 border overflow-hidden',
        'shadow-[0_1px_2px_oklch(0.30_0.04_50_/_0.06)]',
        'transition-shadow',
        isChosen
          ? 'border-brand/70 shadow-[0_0_0_2px_oklch(0.625_0.175_45_/_0.35),0_2px_6px_oklch(0.30_0.04_50_/_0.10)]'
          : 'border-border/80',
      ].join(' ')}
    >
      {restaurant.visited && <VisitedSeal />}

      <div className={['px-5 pt-4 pb-3', restaurant.visited ? 'pl-[3.75rem]' : ''].join(' ')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base text-foreground tracking-tight">
              {restaurant.name}
            </h3>
            {restaurant.mrt_station && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-foreground/65">
                <PinIcon />
                <span>{restaurant.mrt_station}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-brand">
            {restaurant.proximity != null && (
              <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                <ProximityIcon score={restaurant.proximity} />
                <span>{restaurant.proximity}/10</span>
              </span>
            )}
            {restaurant.rating != null && (
              <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                <StarIcon />
                <span>{restaurant.rating}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {(restaurant.tags.length > 0 || restaurant.review) && (
        <div className="px-5 pb-3 space-y-2.5 border-t border-dashed border-border/60 pt-3">
          {restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {restaurant.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] tracking-wide
                             bg-muted/70 text-foreground/80 border border-border/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {restaurant.review && (
            <p className="text-sm text-foreground/75 leading-relaxed">
              <span aria-hidden className="text-brand/60 mr-1">「</span>
              {restaurant.review}
              <span aria-hidden className="text-brand/60 ml-0.5">」</span>
            </p>
          )}
        </div>
      )}

      {(onChoose || isChosen || onDelete) && (
        <div className="px-5 py-3 flex items-center gap-2 border-t border-dashed border-border/60 bg-muted/20">
          {onChoose && (
            <button
              type="button"
              onClick={onChoose}
              className="pudding-press flex-1 inline-flex items-center justify-center gap-1.5
                         rounded-full bg-brand text-brand-foreground text-sm
                         px-4 py-2.5
                         shadow-[0_3px_0_-1px_oklch(0.40_0.140_45)]
                         hover:shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                         active:translate-y-0.5 active:shadow-[0_1px_0_-1px_oklch(0.40_0.140_45)]
                         transition-[transform,box-shadow] duration-150 ease-out
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <BowlIcon />
              <span>就選這家</span>
            </button>
          )}
          {isChosen && (
            <span className="flex-1 inline-flex items-center justify-center gap-1.5
                             text-sm text-brand py-2.5">
              <CheckMark />
              <span>已選擇</span>
            </span>
          )}
          {onDelete && (
            <Link
              href={`/restaurants/${restaurant.id}/edit`}
              className="inline-flex items-center justify-center rounded-full
                         px-3 py-2 text-sm text-foreground/75
                         hover:bg-muted hover:text-foreground transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              編輯
            </Link>
          )}
          {onDelete && !confirmingDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center justify-center rounded-full
                         px-3 py-2 text-sm text-foreground/55
                         hover:bg-destructive/10 hover:text-destructive transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            >
              刪除
            </button>
          )}
          {confirmingDelete && (
            <span className="inline-flex items-center gap-1 text-sm">
              <span className="text-foreground/65">確定？</span>
              <button
                type="button"
                onClick={() => { onDelete!(restaurant.id); setConfirmingDelete(false) }}
                className="rounded-full px-2.5 py-1 text-destructive hover:bg-destructive/10 transition-colors"
              >
                是
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full px-2.5 py-1 text-foreground/65 hover:bg-muted transition-colors"
              >
                否
              </button>
            </span>
          )}
        </div>
      )}
    </article>
  )
}

// — Visited "seal": a soft circular notebook stamp instead of a hard rotated badge.
//   Dashed ring + filled core reads as handmade, not bureaucratic. —
function VisitedSeal() {
  return (
    <div
      className="absolute top-3 left-3 z-10"
      aria-label="已造訪"
      title="已造訪"
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full
                   bg-visited/40 border border-dashed border-visited-foreground/45
                   -rotate-[8deg] select-none"
      >
        <span className="text-[10px] leading-none tracking-[0.05em] text-visited-foreground">
          已訪
        </span>
      </span>
    </div>
  )
}

// — Hand-drawn proximity icons: footprint / transit / car / rail / plane —
function ProximityIcon({ score }: { score: number }) {
  if (score <= 3) return <FootprintIcon />
  if (score <= 6) return <TransitIcon />
  if (score <= 7) return <CarIcon />
  if (score <= 9) return <TrainIcon />
  return <PlaneIcon />
}

function FootprintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="走路距離">
      {/* sole */}
      <path d="M9 4c-2 0-3 2-3 4.5 0 2 1 3.5 2 4.5l1 5c.3 1.4 1.3 2 2 2s1.7-.6 2-2l1-5c1-1 2-2.5 2-4.5C16 6 15 4 13 4c-1 0-1.5.6-2 1-.5-.4-1-1-2-1Z" />
      {/* toe dots */}
      <circle cx="9" cy="2.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="2.4" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="2.4" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="2.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TransitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="搭車距離">
      {/* bus body */}
      <rect x="4" y="5" width="16" height="12" rx="2.5" />
      <line x1="4" y1="11" x2="20" y2="11" />
      <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      {/* wheels */}
      <line x1="7" y1="17" x2="7" y2="19" />
      <line x1="17" y1="17" x2="17" y2="19" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="開車距離">
      <path d="M5 14l1.5-4.5C7 8.4 7.8 8 8.6 8h6.8c.8 0 1.6.4 2.1 1.5L19 14v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
      <line x1="6" y1="14" x2="18" y2="14" />
      <circle cx="8" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="高鐵距離">
      <path d="M3 14c0-4 3-7 9-7s9 3 9 7v1H3Z" />
      <line x1="6" y1="11" x2="18" y2="11" />
      <circle cx="8" cy="14" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="0.8" fill="currentColor" stroke="none" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="飛機距離">
      <path d="M4 14l16-7-3 8-7 1-2 4-1.5-1L7 16l-3-2Z" />
    </svg>
  )
}

// — Location pin (replaces 📍 emoji on MRT row) —
function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  )
}

// — Star (replaces lucide Star) — same brushy stroke language as everything else —
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
         stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
      <path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.8-4.9 2.8 1.1-5.3-4-3.7 5.4-.6Z" />
    </svg>
  )
}

// — Bowl (mini variant of home's SparkBowl, no sparkle — saved for the hero) —
function BowlIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12h18" />
      <path d="M4 12a8 8 0 0 0 16 0" />
      <path d="M9 6c0-1 1-2 1.5-2S11 5 11 6" />
      <path d="M13 5c.5-1 1.4-1.6 2-1.4S15.6 5 15 6" />
    </svg>
  )
}

// — Check mark for the chosen state —
function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12l5 5 11-12" />
    </svg>
  )
}
