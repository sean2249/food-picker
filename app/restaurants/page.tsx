'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Restaurant } from '@/types'

type Tab = '全部' | '未造訪' | '已造訪'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('全部')

  const fetchRestaurants = async () => {
    const res = await fetch('/api/restaurants')
    const data = await res.json()
    setRestaurants(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => { fetchRestaurants() }, [])

  const filtered = restaurants.filter(r => {
    if (tab === '未造訪') return !r.visited
    if (tab === '已造訪') return r.visited
    return true
  })

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
      <header className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
            <BookmarkDot />
            <span>餐廳清單</span>
          </h1>
          <Link
            href="/restaurants/new"
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
          翻翻你蒐藏的小店本
        </p>
      </header>

      {/* Filter tabs — pill row, journal-style with subtle counts */}
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
              <span>{t}</span>
              <span className="text-xs opacity-70 tabular-nums">{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
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
              ? '本子上還是空白的'
              : '這個分類沒有店家'
          }</p>
          {restaurants.length === 0 && (
            <Link
              href="/restaurants/new"
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
              <RestaurantCard restaurant={r} onDelete={handleDelete} />
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
