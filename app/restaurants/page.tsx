'use client'
import { useEffect, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Restaurant } from '@/types'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <p className="text-center text-muted-foreground">載入中...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">餐廳清單</h1>
      <p className="text-sm text-muted-foreground">{restaurants.length} 家餐廳</p>
      {restaurants.length === 0 && (
        <p className="text-muted-foreground">還沒有餐廳，去新增一家吧！</p>
      )}
      {restaurants.map(r => (
        <RestaurantCard key={r.id} restaurant={r} onDelete={handleDelete} />
      ))}
    </div>
  )
}
