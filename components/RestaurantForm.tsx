'use client'
import { useState } from 'react'
import { Restaurant, EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'
import {
  MRT_LINES,
  STATIONS_BY_LINE,
  LINES_BY_STATION,
  isKnownStation,
  type MrtLineId,
} from '@/lib/mrt-stations'

type MrtMode = 'taipei' | 'other'

function initialMrtMode(station: string | null | undefined): MrtMode {
  if (isKnownStation(station)) return 'taipei'
  if (station) return 'other'
  return 'taipei'
}

function initialLineSel(station: string | null | undefined): MrtLineId | '' {
  if (station && LINES_BY_STATION[station]) return LINES_BY_STATION[station][0]
  return ''
}

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
  onCancel?: () => void
  entityType?: EntityType
}

const inputClass =
  'w-full rounded-2xl border border-border/80 bg-card/80 ' +
  'px-4 py-3 text-base text-foreground ' +
  'placeholder:text-foreground/40 ' +
  'focus:outline-none focus:border-brand/60 focus:bg-card ' +
  'transition-colors'

const fieldLabelClass = 'text-xs tracking-[0.08em] text-foreground/65'

export function RestaurantForm({ onSubmit, initialData, onCancel, entityType = 'restaurant' }: Props) {
  const isEdit = !!initialData
  const config = ENTITY_CONFIG[entityType]

  const [name, setName] = useState(initialData?.name ?? '')
  const [mrtMode, setMrtMode] = useState<MrtMode>(initialMrtMode(initialData?.mrt_station))
  const [mrtLineSel, setMrtLineSel] = useState<MrtLineId | ''>(initialLineSel(initialData?.mrt_station))
  const [mrtStationSel, setMrtStationSel] = useState<string>(
    isKnownStation(initialData?.mrt_station) ? (initialData!.mrt_station as string) : ''
  )
  const [mrtOtherText, setMrtOtherText] = useState<string>(
    initialMrtMode(initialData?.mrt_station) === 'other' ? (initialData?.mrt_station ?? '') : ''
  )
  const [items, setItems] = useState<string[]>(initialData?.items ?? [])
  const [itemInput, setItemInput] = useState('')
  const [visited, setVisited] = useState(initialData?.visited ?? false)
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null)
  const [visitDate, setVisitDate] = useState<string>(
    initialData?.visit_date
      ? new Date(initialData.visit_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  )
  const [review, setReview] = useState(initialData?.review ?? '')
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

  const addItem = () => {
    const trimmed = itemInput.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
      setItemInput('')
    }
  }

  const removeItem = (item: string) => setItems(prev => prev.filter(i => i !== item))

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
  }

  const handleGenerateTags = async () => {
    if (!review.trim()) return
    setGeneratingTags(true)
    const res = await fetch('/api/restaurants/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review, name, items, entity_type: entityType }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags(data.tags ?? [])
    }
    setGeneratingTags(false)
  }

  const resolvedStation =
    mrtMode === 'taipei'
      ? (mrtStationSel || null)
      : (mrtOtherText.trim() || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSubmit({
      name: name.trim(),
      mrt_station: resolvedStation,
      items,
      visited,
      rating: visited ? rating : null,
      // Toggling visited on records the chosen date (defaults to today).
      // Toggling off preserves the prior visit_date as historical record.
      visit_date: visited
        ? new Date(visitDate).toISOString()
        : (initialData?.visit_date ?? null),
      review: review.trim() || null,
      tags,
      entity_type: entityType,
    })
    setLoading(false)
  }

  const switchMode = (next: MrtMode) => {
    if (next === mrtMode) return
    setMrtMode(next)
    if (next === 'taipei') {
      setMrtOtherText('')
    } else {
      setMrtLineSel('')
      setMrtStationSel('')
    }
  }

  const handleLineChange = (next: MrtLineId | '') => {
    setMrtLineSel(next)
    if (!next) {
      setMrtStationSel('')
      return
    }
    if (mrtStationSel && !(STATIONS_BY_LINE[next] as readonly string[]).includes(mrtStationSel)) {
      setMrtStationSel('')
    }
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
          placeholder={`${config.label}名稱`}
          required
          className={inputClass}
        />
      </div>

      {/* Location — 雙北捷運 / 其他地區 */}
      <div className="space-y-2">
        <span className={fieldLabelClass}>・ 地點</span>
        <div className="flex gap-1.5" role="radiogroup" aria-label="地點類型">
          {[
            { val: 'taipei' as MrtMode, label: '雙北捷運' },
            { val: 'other' as MrtMode, label: '其他地區' },
          ].map(({ val, label }) => {
            const active = mrtMode === val
            return (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchMode(val)}
                className={[
                  'inline-flex items-center px-4 py-2 rounded-full text-sm border transition-colors',
                  active
                    ? 'bg-brand/15 border-brand/40 text-brand'
                    : 'bg-transparent border-border/70 text-foreground/70 hover:bg-muted/50',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>

        {mrtMode === 'taipei' ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="r-mrt-line" className={fieldLabelClass}>線路</label>
              <select
                id="r-mrt-line"
                value={mrtLineSel}
                onChange={e => handleLineChange(e.target.value as MrtLineId | '')}
                className={inputClass}
              >
                <option value="">選擇線路</option>
                {MRT_LINES.map(line => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="r-mrt-station" className={fieldLabelClass}>站名</label>
              <select
                id="r-mrt-station"
                value={mrtStationSel}
                onChange={e => setMrtStationSel(e.target.value)}
                disabled={!mrtLineSel}
                className={`${inputClass} disabled:opacity-50`}
              >
                <option value="">{mrtLineSel ? '選擇站名' : '請先選線路'}</option>
                {mrtLineSel && STATIONS_BY_LINE[mrtLineSel].map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <label htmlFor="r-mrt-other" className={fieldLabelClass}>地點描述</label>
            <input
              id="r-mrt-other"
              value={mrtOtherText}
              onChange={e => setMrtOtherText(e.target.value)}
              placeholder="例：高鐵新竹站 / 東京新宿"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Visited toggle — pill switch */}
      <div className="space-y-1.5">
        <span className={fieldLabelClass}>・ 造訪狀態</span>
        <div className="flex gap-1.5">
          {[
            { val: false, label: '還沒去' },
            { val: true, label: entityType === 'cafe' ? '喝過了' : '吃過了' },
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
          <span className={fieldLabelClass}>
            ・ 評分（{entityType === 'cafe' ? '喝過' : '吃過'}才能評）
          </span>
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

      {/* Visit date — only when visited. Defaults to today, can backdate. */}
      {visited && (
        <div className="space-y-1.5">
          <label htmlFor="r-visit-date" className={fieldLabelClass}>
            ・ 造訪日期
          </label>
          <div className="flex gap-2">
            <input
              id="r-visit-date"
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => setVisitDate(new Date().toISOString().slice(0, 10))}
              className="rounded-full border border-border bg-card/60
                         px-4 text-sm text-foreground/85
                         hover:bg-card hover:border-foreground/20 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              今天
            </button>
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
          placeholder={
            entityType === 'cafe'
              ? '這家聽說咖啡如何？喝過的人怎麼說？你會怎麼跟別人介紹這家咖啡店'
              : '這家聽說什麼好吃？吃過的人怎麼說？你會怎麼跟別人介紹這家餐廳'
          }
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

      {/* Items — chip array, mirror of tags pattern below */}
      <div className="space-y-2">
        <span className={fieldLabelClass}>
          ・ 招牌品項 <span className="text-foreground/45">（想吃的也可以記）</span>
        </span>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {items.map(itm => (
              <span
                key={itm}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                           bg-brand/12 text-brand border border-brand/30"
              >
                {itm}
                <button
                  type="button"
                  onClick={() => removeItem(itm)}
                  aria-label={`移除品項 ${itm}`}
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
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={handleItemKeyDown}
            placeholder={entityType === 'cafe' ? '想喝的品項（Enter）' : '招牌品項 / 想吃的（Enter）'}
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={addItem}
            className="rounded-full border border-border bg-card/60
                       px-4 text-sm text-foreground/85
                       hover:bg-card hover:border-foreground/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            新增
          </button>
        </div>
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
          {loading ? '儲存中…' : isEdit ? '儲存變更' : config.newTitle}
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
