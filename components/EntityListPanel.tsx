'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RestaurantCard } from '@/components/RestaurantCard'
import { SectionNav } from '@/components/SectionNav'
import { Restaurant, EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'
import {
  MRT_LINES,
  STATIONS_BY_LINE,
  getLinesForStation,
  type MrtLineId,
} from '@/lib/mrt-stations'

type Tab = '全部' | '未造訪' | '已造訪'

interface Props {
  entityType: EntityType
}

export function EntityListPanel({ entityType }: Props) {
  const config = ENTITY_CONFIG[entityType]
  const isCafe = entityType === 'cafe'
  const visitedLabel = isCafe ? '喝過' : '已造訪'
  const unvisitedLabel = isCafe ? '沒喝過' : '未造訪'

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('全部')
  const [lineFilter, setLineFilter] = useState<MrtLineId | 'all'>('all')
  const [stationFilter, setStationFilter] = useState<string | 'all'>('all')

  const handleLineFilterChange = (next: MrtLineId | 'all') => {
    setLineFilter(next)
    if (next === 'all') {
      setStationFilter('all')
      return
    }
    if (stationFilter !== 'all' && !(STATIONS_BY_LINE[next] as readonly string[]).includes(stationFilter)) {
      setStationFilter('all')
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch(`/api/restaurants?type=${entityType}`)
      const data = await res.json()
      if (!active) return
      setRestaurants(data)
      setLoading(false)
    })()
    return () => { active = false }
  }, [entityType])

  const filtered = restaurants.filter(r => {
    if (tab === '未造訪' && r.visited) return false
    if (tab === '已造訪' && !r.visited) return false
    if (lineFilter !== 'all' && !getLinesForStation(r.mrt_station).includes(lineFilter)) return false
    if (stationFilter !== 'all' && r.mrt_station !== stationFilter) return false
    return true
  })

  const tabLabels: Record<Tab, string> = {
    '全部': '全部',
    '未造訪': unvisitedLabel,
    '已造訪': visitedLabel,
  }

  const tabClass = (target: Tab): string => {
    const active = tab === target
    if (active) {
      return target === '已造訪'
        ? 'bg-visited/60 border-visited-foreground/40 text-visited-foreground'
        : 'bg-brand/15 border-brand/40 text-brand'
    }
    return 'bg-transparent border-border/70 text-foreground/70 hover:bg-muted/50 hover:text-foreground'
  }

  return (
    <div className="zakka-content space-y-5 pt-4">
      <SectionNav entityType={entityType} />

      <header className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
            <BookmarkDot />
            <span>{config.listTitle}</span>
          </h1>
          <Link
            href={config.newPath}
            className="inline-flex items-center gap-1.5 rounded-full
                       border border-border bg-card/70
                       px-3 py-1.5 text-sm text-foreground/80
                       hover:bg-card hover:border-foreground/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <PlusIcon />
            <span>新增</span>
          </Link>
        </div>
        <p className="text-sm text-foreground/65">
          {config.listSubtitle}
        </p>
      </header>

      <div role="tablist" aria-label="造訪狀態" className="flex flex-wrap gap-1.5">
        {(['全部', '未造訪', '已造訪'] as Tab[]).map(t => {
          const count =
            t === '全部' ? restaurants.length :
            t === '未造訪' ? restaurants.filter(r => !r.visited).length :
            restaurants.filter(r => r.visited).length
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
                tabClass(t),
              ].join(' ')}
            >
              <span>{tabLabels[t]}</span>
              <span className="text-xs opacity-70 tabular-nums">{count}</span>
            </button>
          )
        })}
      </div>

      {/* MRT line/station filter */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleLineFilterChange('all')}
            className={[
              'px-2.5 py-1 rounded-full text-xs border transition-colors',
              lineFilter === 'all'
                ? 'bg-brand/15 border-brand/40 text-brand'
                : 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50',
            ].join(' ')}
          >
            全部線路
          </button>
          {MRT_LINES.map(line => {
            const active = lineFilter === line.id
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => handleLineFilterChange(line.id)}
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

        {lineFilter !== 'all' && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStationFilter('all')}
              className={[
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                stationFilter === 'all'
                  ? 'bg-brand/15 border-brand/40 text-brand'
                  : 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50',
              ].join(' ')}
            >
              全部站
            </button>
            {STATIONS_BY_LINE[lineFilter].map(station => {
              const active = stationFilter === station
              return (
                <button
                  key={station}
                  type="button"
                  onClick={() => setStationFilter(station)}
                  className={[
                    'px-2.5 py-1 rounded-full text-xs border transition-colors',
                    active
                      ? 'bg-brand/15 border-brand/40 text-brand'
                      : 'bg-transparent border-border/70 text-foreground/75 hover:bg-muted/50',
                  ].join(' ')}
                >
                  {station}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <ul className="space-y-3" aria-busy="true">
          {[1, 2, 3].map(i => (
            <li
              key={i}
              className="rounded-2xl bg-card/70 border border-border/70 p-4 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded-full w-16" />
                <div className="h-5 bg-muted rounded-full w-12" />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card/80 border border-dashed border-border/80
                        px-5 py-10 text-center space-y-2">
          <p className="text-foreground/70">{
            restaurants.length === 0
              ? config.emptyHint
              : '這個分類沒有店家'
          }</p>
          {restaurants.length === 0 && (
            <Link
              href={config.newPath}
              className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
            >
              <PlusIcon />
              <span>記下第一家</span>
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(r => (
            <li key={r.id}>
              <RestaurantCard restaurant={r} entityType={entityType} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BookmarkDot() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden>
      <path d="M2 1.5h10v12l-5-3-5 3v-12Z"
            fill="oklch(0.625 0.175 45 / 0.18)"
            stroke="oklch(0.625 0.175 45)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
