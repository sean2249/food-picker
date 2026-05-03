'use client'
import { useEffect, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { RecommendResponse } from '@/types'

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

export default function RecommendPage() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visitedFilter, setVisitedFilter] = useState<'all' | 'visited' | 'unvisited'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [maxProximity, setMaxProximity] = useState(10)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then((data: { tags?: string[] }[]) => {
        const tags = Array.from(new Set(data.flatMap(r => r.tags ?? [])))
        setAllTags(tags)
      })
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleRecommend = async () => {
    setLoading(true)
    setResult(null)
    setChosen(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item: item || undefined,
        visited_filter: visitedFilter,
        tags: selectedTags.length ? selectedTags : undefined,
        max_proximity: maxProximity < 10 ? maxProximity : undefined,
      }),
    })
    const data = await res.json()
    setResult(data)
    setFiltersOpen(true)
    setLoading(false)
  }

  const handleChoose = async (restaurantId: string) => {
    if (!result || chosen) return
    setChosen(restaurantId)
    await fetch('/api/recommend/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chosen_restaurant_id: restaurantId,
        shown_restaurant_ids: result.results.map(r => r.restaurant.id),
      }),
    })
  }

  const filterCount =
    (visitedFilter !== 'all' ? 1 : 0) +
    selectedTags.length +
    (maxProximity < 10 ? 1 : 0)

  return (
    <div className="zakka-content space-y-6 pt-4">
      {/* Page header — handwritten section title with bookmark dot */}
      <header className="space-y-2">
        <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
          <BookmarkDot />
          <span>推薦給我</span>
        </h1>
        <p className="text-sm text-foreground/65">
          說一句你今天想吃什麼，我幫你挑三家
        </p>
      </header>

      {/* Search input — labeled as a journal prompt */}
      <section className="space-y-2">
        <label htmlFor="recommend-item" className="text-xs tracking-[0.08em] text-foreground/65">
          ・ 想吃什麼？也可以說說心情
        </label>
        <input
          id="recommend-item"
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：我想要包子、今天有點累"
          className="w-full rounded-2xl border border-border/80 bg-card/80
                     px-4 py-3 text-base text-foreground
                     placeholder:text-foreground/40
                     focus:outline-none focus:border-brand/60 focus:bg-card
                     transition-colors"
        />
      </section>

      {/* Filters — collapsible, dashed border for journal feel */}
      <section
        className="rounded-2xl bg-card/80 border border-border/80 overflow-hidden
                   shadow-[0_1px_2px_oklch(0.30_0.04_50_/_0.05)]"
      >
        <button
          type="button"
          onClick={() => setFiltersOpen(prev => !prev)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
          className="w-full flex items-center justify-between px-4 py-3 text-sm
                     hover:bg-muted/40 transition-colors group
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon />
            <span>篩選條件</span>
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5
                               rounded-full bg-brand/15 text-brand text-[11px]">
                {filterCount}
              </span>
            )}
          </span>
          <span
            aria-hidden
            className={`text-brand text-base leading-none transition-transform
                        ${filtersOpen ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        <div
          id="filter-panel"
          aria-hidden={!filtersOpen}
          className={`grid transition-[grid-template-rows] duration-300 ease-out
                      ${filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-5 border-t border-dashed border-border/70 pt-4">
              {/* Visited filter — chip-style radios */}
              <fieldset className="space-y-2">
                <legend className="text-xs tracking-[0.08em] text-foreground/65">・ 造訪狀態</legend>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['all', '全部'],
                    ['unvisited', '只推未造訪'],
                    ['visited', '只推已造訪'],
                  ] as const).map(([val, label]) => {
                    const active = visitedFilter === val
                    return (
                      <label
                        key={val}
                        className={[
                          'cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors',
                          active
                            ? 'bg-brand/15 border-brand/40 text-brand'
                            : 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="visited_filter"
                          value={val}
                          checked={active}
                          onChange={() => setVisitedFilter(val)}
                          className="sr-only"
                          tabIndex={filtersOpen ? 0 : -1}
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {/* Tag chips */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.08em] text-foreground/65">
                    ・ 標籤 <span className="text-foreground/45">（不選 = 不限）</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map(tag => {
                      const active = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          tabIndex={filtersOpen ? 0 : -1}
                          className={[
                            'px-2.5 py-1 rounded-full text-xs border transition-colors',
                            active
                              ? 'bg-brand/15 border-brand/40 text-brand'
                              : 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50',
                          ].join(' ')}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Distance slider */}
              <div className="space-y-2">
                <p className="text-xs tracking-[0.08em] text-foreground/65 flex items-baseline justify-between">
                  <span>・ 距離上限</span>
                  <span className="text-foreground/85 text-sm">
                    {maxProximity === 10 ? '不限' : PROXIMITY_LABELS[maxProximity]}
                  </span>
                </p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxProximity}
                  onChange={e => setMaxProximity(Number(e.target.value))}
                  tabIndex={filtersOpen ? 0 : -1}
                  className="w-full accent-brand"
                  aria-label="距離上限"
                  aria-valuetext={maxProximity === 10 ? '不限' : PROXIMITY_LABELS[maxProximity]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary CTA — pudding press, same recipe as home but a little tighter */}
      <button
        type="button"
        onClick={handleRecommend}
        disabled={loading}
        className="pudding-press group relative block w-full rounded-full bg-brand text-brand-foreground
                   px-6 py-4 text-lg
                   shadow-[0_6px_0_-1px_oklch(0.40_0.140_45)]
                   hover:shadow-[0_5px_0_-1px_oklch(0.40_0.140_45)] hover:-translate-y-px
                   active:translate-y-1 active:shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]
                   disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:translate-y-0
                   transition-[transform,box-shadow] duration-150 ease-out
                   focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="inline-flex items-center gap-2">
          <DiceIcon spinning={loading} />
          <span>{loading ? '正在挑…' : '推薦給我！'}</span>
        </span>
      </button>

      {result && (
        <section className="space-y-4">
          {/* Reroll button — ghost outline, less weight than primary */}
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading}
            className="w-full rounded-full border border-border bg-card/60
                       px-5 py-2.5 text-sm text-foreground/85
                       hover:bg-card hover:border-foreground/20 transition-colors
                       disabled:opacity-60
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {loading ? '推薦中…' : '調整篩選後再推薦一次'}
          </button>

          {/* AI reasoning — quiet card with bookmark dot */}
          {result.reasoning && (
            <div className="rounded-2xl bg-card/85 border border-dashed border-border/80
                            px-4 py-3 text-sm text-foreground/80 leading-relaxed">
              <div className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] text-foreground/55 mb-1.5">
                <BookmarkDot small />
                <span>挑選筆記</span>
              </div>
              <p>{result.reasoning}</p>
            </div>
          )}

          {result.results.length === 0 && (
            <p className="text-center text-foreground/60 py-6">
              暫時沒有合適的推薦
            </p>
          )}

          <ul className="space-y-4">
            {result.results.map(({ restaurant, message }, i) => (
              <li key={restaurant.id} className="space-y-2">
                {/* Per-result message — small annotation above the card */}
                <p className="px-2 text-sm text-foreground/75 leading-relaxed inline-flex items-start gap-2">
                  <span aria-hidden className="mt-1 h-1 w-1 rounded-full bg-brand/70 shrink-0" />
                  <span>
                    <span className="text-foreground/45 mr-1.5 tabular-nums">{i + 1}.</span>
                    {message}
                  </span>
                </p>
                <RestaurantCard
                  restaurant={restaurant}
                  onChoose={chosen ? undefined : () => handleChoose(restaurant.id)}
                  isChosen={chosen === restaurant.id}
                />
              </li>
            ))}
          </ul>

          {chosen && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-brand">
              <span aria-hidden className="h-px w-8 bg-brand/30" />
              <span>已記錄你的選擇</span>
              <span aria-hidden className="h-px w-8 bg-brand/30" />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// — Bookmark dot icon, mirrors home's updates header for visual rhyme —
function BookmarkDot({ small = false }: { small?: boolean }) {
  const size = small ? 11 : 14
  return (
    <svg width={size} height={small ? 13 : 16} viewBox="0 0 14 16" fill="none" aria-hidden>
      <path d="M2 1.5h10v12l-5-3-5 3v-12Z"
            fill="oklch(0.625 0.175 45 / 0.18)"
            stroke="oklch(0.625 0.175 45)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

// — Filter funnel (brushy stroke) —
function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16l-6 8v6l-4-2v-4Z" />
    </svg>
  )
}

// — Dice that wobbles while loading. Tiramisu is dessert; recommendation is dice — playful contrast. —
function DiceIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
      className={spinning ? 'animate-spin' : ''}
      style={spinning ? { animationDuration: '900ms' } : undefined}
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
