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
    if (!confirm('確定刪除？')) return
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => { fetchRestaurants() }, [])

  const filtered = restaurants.filter(r => {
    if (tab === '未造訪') return !r.visited
    if (tab === '已造訪') return r.visited
    return true
  })

  if (loading) return <p className="text-center text-muted-foreground">載入中...</p>

  const getFilterButtonClass = (target: Tab): string => {
    const active = tab === target

    if (target === '已造訪') {
      return active
        ? 'bg-[#E46C0A] text-white border-[#E46C0A]'
        : 'border-[#E46C0A]/40 text-[#A04D08] hover:bg-[#E46C0A]/10'
    }

    if (target === '未造訪') {
      return active
        ? 'bg-[#F5F5F5] text-[#4A4A4A] border-[#E0E0E0]'
        : 'border-[#E0E0E0] text-[#666666] hover:bg-[#F7F7F7]'
    }

    return active
      ? 'bg-primary text-primary-foreground border-primary'
      : 'border-border hover:bg-muted'
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">餐廳清單</h1>
      <div className="flex gap-2">
        {(['全部', '未造訪', '已造訪'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${getFilterButtonClass(t)}`}
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
