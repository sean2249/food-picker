'use client'
import { useEffect, useState } from 'react'
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

  const getFilterButtonClass = (target: Tab): string => {
    const active = tab === target

    if (target === '已造訪') {
      if (active) return 'bg-visited text-visited-foreground border-visited'
      return 'border-visited text-visited-foreground hover:bg-visited/35'
    }

    if (target === '未造訪') {
      if (active) return 'bg-muted text-foreground border-border'
      return 'border-border text-muted-foreground hover:bg-muted'
    }

    if (active) return 'bg-brand text-brand-foreground border-brand'
    return 'border-border text-muted-foreground hover:bg-muted'
  }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">餐廳清單</h1>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded-full w-16" />
              <div className="h-5 bg-muted rounded-full w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">餐廳清單</h1>
      <div className="flex gap-2">
        {(['全部', '未造訪', '已造訪'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${getFilterButtonClass(t)}`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} 家餐廳</p>
      {filtered.length === 0 && (
        <p className="text-muted-foreground">沒有符合條件的餐廳</p>
      )}
      {filtered.map(r => (
        <RestaurantCard key={r.id} restaurant={r} onDelete={handleDelete} />
      ))}
    </div>
  )
}
