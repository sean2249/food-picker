'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Restaurant, EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'
import { getLinesForStation, LINES_BY_ID } from '@/lib/mrt-stations'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
  entityType?: EntityType
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen, entityType }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const type: EntityType = entityType ?? restaurant.entity_type ?? 'restaurant'
  const config = ENTITY_CONFIG[type]
  const editHref = `${config.basePath}/${restaurant.id}/edit`

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
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-foreground/65 flex-wrap">
                <PinIcon />
                {getLinesForStation(restaurant.mrt_station).map(id => {
                  const line = LINES_BY_ID[id]
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                      style={{ backgroundColor: line.color, color: line.textColor }}
                      title={line.name}
                    >
                      {line.short}
                    </span>
                  )
                })}
                <span>{restaurant.mrt_station}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-brand">
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
              {type === 'cafe' ? <CupIcon /> : <BowlIcon />}
              <span>{config.chooseCTA}</span>
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
              href={editHref}
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

// — Coffee cup (cafe variant of the chooser CTA icon) —
function CupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M9 4c0 1 0 1.5-.5 2.2M12 4c0 1 0 1.5-.5 2.2M15 4c0 1 0 1.5-.5 2.2" />
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
