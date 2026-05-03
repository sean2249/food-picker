'use client'
import { useState } from 'react'
import { Restaurant } from '@/types'

const PROXIMITY_LABELS: Record<number, string> = {
  1: '走路 5 分鐘',
  2: '走路 15 分鐘',
  3: '走路 30 分鐘',
  4: '搭車 15 分鐘',
  5: '搭車快一小時',
  6: '搭車一小時以上',
  7: '開車才方便',
  8: '跨縣市',
  9: '台灣另一端',
  10: '出國的',
}

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
  onCancel?: () => void
}

const inputClass =
  'w-full rounded-2xl border border-border/80 bg-card/80 ' +
  'px-4 py-3 text-base text-foreground ' +
  'placeholder:text-foreground/40 ' +
  'focus:outline-none focus:border-brand/60 focus:bg-card ' +
  'transition-colors'

const fieldLabelClass = 'text-xs tracking-[0.08em] text-foreground/65'

export function RestaurantForm({ onSubmit, initialData, onCancel }: Props) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [mrtStation, setMrtStation] = useState(initialData?.mrt_station ?? '')
  const [items] = useState<string[]>(initialData?.items ?? [])
  const [visited, setVisited] = useState(initialData?.visited ?? false)
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null)
  const [review, setReview] = useState(initialData?.review ?? '')
  const [proximity, setProximity] = useState<number>(initialData?.proximity ?? 5)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [generatingTags, setGeneratingTags] = useState(false)
  const [loading, setLoading] = useState(false)

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  const handleGenerateTags = async () => {
    if (!review.trim()) return
    setGeneratingTags(true)
    const res = await fetch('/api/restaurants/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review, name, items }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags(data.tags ?? [])
    }
    setGeneratingTags(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
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
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name (required) */}
      <div className="space-y-1.5">
        <label htmlFor="r-name" className={fieldLabelClass}>
          ・ 店名 <span className="text-brand">*</span>
        </label>
        <input
          id="r-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="餐廳名稱"
          required
          className={inputClass}
        />
      </div>

      {/* MRT */}
      <div className="space-y-1.5">
        <label htmlFor="r-mrt" className={fieldLabelClass}>
          ・ 捷運站
        </label>
        <input
          id="r-mrt"
          value={mrtStation}
          onChange={e => setMrtStation(e.target.value)}
          placeholder="例：大安、信義安和"
          className={inputClass}
        />
      </div>

      {/* Distance — slider with playful label */}
      <fieldset className="space-y-2">
        <legend className={`${fieldLabelClass} flex items-baseline justify-between w-full`}>
          <span>・ 距離</span>
          <span className="text-foreground/85 text-sm">{PROXIMITY_LABELS[proximity]}</span>
        </legend>
        <input
          type="range"
          min={1}
          max={10}
          value={proximity}
          onChange={e => setProximity(Number(e.target.value))}
          className="w-full accent-brand"
          aria-label="距離"
          aria-valuetext={PROXIMITY_LABELS[proximity]}
        />
        <div className="flex justify-between text-[10px] text-foreground/45 px-0.5 select-none">
          <span>近</span>
          <span>遠</span>
        </div>
      </fieldset>

      {/* Visited toggle — pill switch */}
      <div className="space-y-1.5">
        <span className={fieldLabelClass}>・ 造訪狀態</span>
        <div className="flex gap-1.5">
          {[
            { val: false, label: '還沒去' },
            { val: true, label: '吃過了' },
          ].map(({ val, label }) => {
            const active = visited === val
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => setVisited(val)}
                className={[
                  'inline-flex items-center px-4 py-2 rounded-full text-sm border transition-colors',
                  active
                    ? val
                      ? 'bg-visited/60 border-visited-foreground/40 text-visited-foreground'
                      : 'bg-brand/15 border-brand/40 text-brand'
                    : 'bg-transparent border-border/70 text-foreground/70 hover:bg-muted/50',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rating — only when visited. 5 stars, brushy outlined → filled */}
      {visited && (
        <div className="space-y-1.5">
          <span className={fieldLabelClass}>・ 評分（吃過才能評）</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="評分 1 到 5">
            {[1, 2, 3, 4, 5].map(n => {
              const active = rating != null && rating >= n
              const isCurrent = rating === n
              return (
                <button
                  type="button"
                  key={n}
                  role="radio"
                  aria-checked={isCurrent}
                  onClick={() => setRating(n)}
                  className={[
                    'h-11 w-11 inline-flex items-center justify-center rounded-full border transition-colors',
                    active
                      ? 'bg-brand/15 border-brand/50 text-brand'
                      : 'border-border/70 text-foreground/40 hover:bg-muted/50 hover:text-foreground/60',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                  ].join(' ')}
                  aria-label={`${n} 顆`}
                >
                  <StarIcon filled={active} />
                </button>
              )
            })}
            {rating != null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="ml-1 self-center text-xs text-foreground/55 hover:text-foreground/85 underline-offset-2 hover:underline"
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review — textarea, doubles as note + short review */}
      <div className="space-y-1.5">
        <label htmlFor="r-review" className={fieldLabelClass}>
          ・ 短評 / 備註 <span className="text-foreground/45">（沒去過也可以記下聽說什麼）</span>
        </label>
        <textarea
          id="r-review"
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="這家聽說什麼好吃？吃過的人怎麼說？你會怎麼跟別人介紹這家餐廳"
          rows={4}
          className={`${inputClass} resize-y min-h-[6rem] leading-relaxed`}
        />
        {review.trim() && (
          <button
            type="button"
            onClick={handleGenerateTags}
            disabled={generatingTags}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full
                       border border-dashed border-brand/40 bg-brand/5
                       px-3 py-1.5 text-xs text-brand
                       hover:bg-brand/10 hover:border-brand/60 transition-colors
                       disabled:opacity-60
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <SparkleIcon spinning={generatingTags} />
            <span>{generatingTags ? '產生中…' : '幫我建議標籤'}</span>
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <span className={fieldLabelClass}>・ 標籤</span>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                           bg-brand/12 text-brand border border-brand/30"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`移除標籤 ${tag}`}
                  className="inline-flex items-center justify-center h-5 w-5 -mr-1 rounded-full
                             hover:bg-brand/15 transition-colors"
                >
                  <span aria-hidden className="text-sm leading-none">×</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="手動新增標籤（Enter）"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-full border border-border bg-card/60
                       px-4 text-sm text-foreground/85
                       hover:bg-card hover:border-foreground/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            新增
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="pudding-press flex-1 rounded-full bg-brand text-brand-foreground
                     px-6 py-3.5 text-base
                     shadow-[0_5px_0_-1px_oklch(0.40_0.140_45)]
                     hover:shadow-[0_4px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                     active:translate-y-1 active:shadow-[0_1px_0_-1px_oklch(0.40_0.140_45)]
                     disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:translate-y-0
                     transition-[transform,box-shadow] duration-150 ease-out
                     focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {loading ? '儲存中…' : isEdit ? '儲存變更' : '新增餐廳'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-border bg-card/60
                       px-5 py-3 text-base text-foreground/85
                       hover:bg-card hover:border-foreground/20 transition-colors
                       disabled:opacity-60
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}

// — Brushy star with optional fill (for the rating component) —
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"
         fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.8-4.9 2.8 1.1-5.3-4-3.7 5.4-.6Z" />
    </svg>
  )
}

// — Sparkle for the AI tag-suggest button. Spins while generating. —
function SparkleIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className={spinning ? 'animate-spin' : ''}
         style={spinning ? { animationDuration: '900ms' } : undefined}
         aria-hidden>
      <path d="M12 4v6M12 14v6M4 12h6M14 12h6" />
    </svg>
  )
}
