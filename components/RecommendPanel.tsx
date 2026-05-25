'use client'
import { useEffect, useMemo, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { SectionNav } from '@/components/SectionNav'
import { FloatingMascot, type MascotPose } from '@/components/FloatingMascot'
import { RecommendResponse, EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'
import { MRT_LINES, STATIONS_BY_LINE, type MrtLineId } from '@/lib/mrt-stations'

interface Props {
  entityType: EntityType
}

export function RecommendPanel({ entityType }: Props) {
  const config = ENTITY_CONFIG[entityType]
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visitedFilter, setVisitedFilter] = useState<'all' | 'visited' | 'unvisited'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [locationMode, setLocationMode] = useState<'mrt' | 'other'>('mrt')
  const [mrtLineFilter, setMrtLineFilter] = useState<MrtLineId | 'all'>('all')
  const [mrtStationFilter, setMrtStationFilter] = useState<string | 'all'>('all')
  const [allTags, setAllTags] = useState<string[]>([])

  const handleLineFilterChange = (next: MrtLineId | 'all') => {
    setMrtLineFilter(next)
    if (next === 'all') {
      setMrtStationFilter('all')
      return
    }
    if (mrtStationFilter !== 'all' && !(STATIONS_BY_LINE[next] as readonly string[]).includes(mrtStationFilter)) {
      setMrtStationFilter('all')
    }
  }

  const handleLocationModeChange = (next: 'mrt' | 'other') => {
    setLocationMode(next)
    if (next === 'other') {
      setMrtLineFilter('all')
      setMrtStationFilter('all')
    }
  }

  useEffect(() => {
    fetch(`/api/restaurants?type=${entityType}`)
      .then(r => r.json())
      .then((data: { tags?: string[] }[]) => {
        const tags = Array.from(new Set(data.flatMap(r => r.tags ?? [])))
        setAllTags(tags)
      })
  }, [entityType])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleRecommend = async () => {
    // Capture previous round's IDs before clearing so reroll won't repeat them.
    const excludeIds = result?.results.map(r => r.restaurant.id) ?? []
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
        mrt_line: locationMode === 'mrt' && mrtLineFilter !== 'all' ? mrtLineFilter : undefined,
        mrt_station: locationMode === 'mrt' && mrtStationFilter !== 'all' ? mrtStationFilter : undefined,
        location_mode: locationMode,
        entity_type: entityType,
        exclude_ids: excludeIds.length ? excludeIds : undefined,
      }),
    })
    const data = await res.json()
    setResult(data)
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
        entity_type: entityType,
      }),
    })
  }

  const filterCount =
    (visitedFilter !== 'all' ? 1 : 0) +
    selectedTags.length +
    (locationMode === 'other' ? 1 : 0) +
    (mrtLineFilter !== 'all' ? 1 : 0) +
    (mrtStationFilter !== 'all' ? 1 : 0)

  const visitedLabels: Array<['all' | 'unvisited' | 'visited', string]> =
    entityType === 'cafe'
      ? [
          ['all', '全部'],
          ['unvisited', '只推沒喝過的'],
          ['visited', '只推喝過的'],
        ]
      : [
          ['all', '全部'],
          ['unvisited', '只推未造訪'],
          ['visited', '只推已造訪'],
        ]

  // Active state hierarchy: single-select gets a strong fill so one
  // committed choice reads as primary; multi-select stays in soft tint
  // so the set of applied tags reads as a calm cluster.
  const singleActive = 'bg-brand text-brand-foreground border-brand'
  const multiActive = 'bg-brand/15 border-brand/40 text-brand'
  const chipInactive = 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50'


  // Pose + bubble for the always-present floating mascot.
  // Pose precedence: chosen > loading > sad (empty result) > presenting > idle.
  // (loading wins over sad because we don't know it's empty until results
  // actually arrive; while still fetching, the mascot is thinking, not sad.)
  const pose: MascotPose =
    chosen ? 'celebrating'
    : loading ? 'thinking'
    : result && result.results.length === 0 ? 'sad'
    : result ? 'presenting'
    : 'idle'

  // Context-aware thinking messages — cycle while loading.
  // Pre-canned in client, no LLM cost. Picked based on time of day +
  // applied filters so it feels like the mascot read the form.
  const [thinkingIdx, setThinkingIdx] = useState(0)
  const thinkingMessages = useMemo(() => {
    const hour = new Date().getHours()
    const slot =
      hour < 5 ? '深夜了' :
      hour < 10 ? '早上' :
      hour < 14 ? '中午' :
      hour < 17 ? '下午' :
      hour < 20 ? '傍晚' : '晚上'
    const msgs = ['嗯⋯讓我想想⋯', `現在${slot}，挑點合適的⋯`]
    if (mrtLineFilter !== 'all') {
      const line = MRT_LINES.find(l => l.id === mrtLineFilter)
      if (line) msgs.push(`找${line.short}線附近⋯`)
    }
    if (selectedTags.length > 0) {
      msgs.push(`要 ${selectedTags.slice(0, 2).join('、')} 的⋯`)
    }
    if (item) msgs.push(`你想吃「${item.slice(0, 8)}」啊⋯`)
    msgs.push('快好了⋯')
    return msgs
  }, [mrtLineFilter, selectedTags, item])

  // Restart the thinking-message cycle when loading begins (adjust during
  // render, not in an effect). The effect only drives the interval.
  const [prevLoading, setPrevLoading] = useState(false)
  if (prevLoading !== loading) {
    setPrevLoading(loading)
    if (loading) setThinkingIdx(0)
  }

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setThinkingIdx(i => (i + 1) % thinkingMessages.length)
    }, 1400)
    return () => clearInterval(id)
  }, [loading, thinkingMessages.length])

  const mascotMessage =
    chosen ? '好選擇！吃飽再來找我'
    : loading ? thinkingMessages[thinkingIdx]
    : result && result.results.length === 0 ? '找不到耶，鬆綁一下條件試試？'
    : result?.reasoning ?? null  // null → bubble hidden in idle

  return (
    <div className="zakka-content space-y-6 pt-4 pb-28">
      <SectionNav entityType={entityType} />

      {/* Page header — handwritten section title with bookmark dot */}
      <header className="space-y-2">
        <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
          <BookmarkDot />
          <span>{config.recommendTitle}</span>
        </h1>
        <p className="text-sm text-foreground/65">
          {config.recommendSubtitle}
        </p>
      </header>

      {/* Search input — labeled as a journal prompt */}
      <section className="space-y-3">
        <label htmlFor="recommend-item" className="text-sm text-foreground/70">
          ・ {config.itemFieldLabel}
        </label>
        <input
          id="recommend-item"
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder={config.itemPlaceholder}
          className="w-full rounded-2xl border border-border/80 bg-card/80
                     px-4 py-3 text-base text-foreground
                     placeholder:text-foreground/40
                     focus:outline-none focus:border-brand/60 focus:bg-card
                     transition-colors"
        />
      </section>

      {/* Primary CTA — the only visually heavy thing on the page */}
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
          <span>{loading ? config.recommendLoading : config.recommendCTA}</span>
        </span>
      </button>

      {/* Filters — inline toggle (no card chrome), tucked after the CTA */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setFiltersOpen(prev => !prev)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
          className="w-full flex items-center justify-between px-1 py-2 text-sm
                     text-foreground/60 hover:text-foreground/85 transition-colors rounded
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40
                     focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon />
            <span>
              {filterCount > 0
                ? `已套用 ${filterCount} 項篩選`
                : '加上篩選條件'}
            </span>
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
            <div className="pt-5 pb-5 space-y-5 border-t border-dashed border-border/60">
              {/* Visited filter — single-select */}
              <fieldset className="space-y-3">
                <legend className="text-sm text-foreground/70">
                  ・ {entityType === 'cafe' ? '是否喝過' : '造訪狀態'}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {visitedLabels.map(([val, label]) => {
                    const active = visitedFilter === val
                    return (
                      <label
                        key={val}
                        className={[
                          'cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors',
                          active ? singleActive : chipInactive,
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

              {/* Tag chips — multi-select (kept in soft tint) */}
              {allTags.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/70">
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
                            active ? multiActive : chipInactive,
                          ].join(' ')}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Location type — 雙北捷運 / 其他地區 (mirrors the add form) */}
              <div className="space-y-3">
                <p className="text-sm text-foreground/70">・ 地點</p>
                <div className="flex flex-wrap gap-1.5">
                  {([['mrt', '雙北捷運'], ['other', '其他地區']] as const).map(([val, label]) => {
                    const active = locationMode === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleLocationModeChange(val)}
                        tabIndex={filtersOpen ? 0 : -1}
                        className={[
                          'px-2.5 py-1 rounded-full text-xs border transition-colors',
                          active ? singleActive : chipInactive,
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {locationMode === 'mrt' && (
              <>
              {/* MRT line — single-select. Line buttons keep their colored dot
                  treatment so the line identity reads first. */}
              <div className="space-y-3">
                <p className="text-sm text-foreground/70">・ 捷運線路</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLineFilterChange('all')}
                    tabIndex={filtersOpen ? 0 : -1}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs border transition-colors',
                      mrtLineFilter === 'all' ? singleActive : chipInactive,
                    ].join(' ')}
                  >
                    全部
                  </button>
                  {MRT_LINES.map(line => {
                    const active = mrtLineFilter === line.id
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => handleLineFilterChange(line.id)}
                        tabIndex={filtersOpen ? 0 : -1}
                        title={line.name}
                        className={[
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors',
                          active
                            ? 'border-brand/60 text-foreground'
                            : 'border-border/70 text-foreground/75 hover:bg-muted/50',
                        ].join(' ')}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: line.color }}
                          aria-hidden
                        />
                        {line.short}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* MRT station — single-select */}
              {mrtLineFilter !== 'all' && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/70">・ 捷運站</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMrtStationFilter('all')}
                      tabIndex={filtersOpen ? 0 : -1}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs border transition-colors',
                        mrtStationFilter === 'all' ? singleActive : chipInactive,
                      ].join(' ')}
                    >
                      全部站
                    </button>
                    {STATIONS_BY_LINE[mrtLineFilter].map(station => {
                      const active = mrtStationFilter === station
                      return (
                        <button
                          key={station}
                          type="button"
                          onClick={() => setMrtStationFilter(station)}
                          tabIndex={filtersOpen ? 0 : -1}
                          className={[
                            'px-2.5 py-1 rounded-full text-xs border transition-colors',
                            active ? singleActive : chipInactive,
                          ].join(' ')}
                        >
                          {station}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      </section>

      {result && (
        // setResult(null) → setResult(data) already unmounts and remounts this
        // section across the loading boundary, so the entrance animations replay.
        <section className="space-y-4">
          {/* Reroll button */}
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

          {/* reasoning now lives in the floating mascot's typewriter bubble */}

          {result.results.length === 0 && (
            <p className="text-center text-foreground/60 py-6">
              暫時沒有合適的推薦
            </p>
          )}

          <ul className="space-y-4">
            {result.results.map(({ restaurant, message }, i) => (
              <li
                key={restaurant.id}
                className="space-y-2 animate-[recommend-fade-rise_400ms_ease-out_both]"
                style={{ animationDelay: `${120 + i * 120}ms` }}
              >
                <p className="px-2 text-sm text-foreground/75 leading-relaxed inline-flex items-start gap-2">
                  <span aria-hidden className="mt-1 h-1 w-1 rounded-full bg-brand/70 shrink-0" />
                  <span>
                    <span className="text-foreground/45 mr-1.5 tabular-nums">{i + 1}.</span>
                    {message}
                  </span>
                </p>
                <RestaurantCard
                  restaurant={restaurant}
                  entityType={entityType}
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

      <FloatingMascot
        pose={pose}
        message={mascotMessage}
        typewriter={pose === 'presenting' || pose === 'sad' || pose === 'celebrating'}
      />
    </div>
  )
}

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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16l-6 8v6l-4-2v-4Z" />
    </svg>
  )
}

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
