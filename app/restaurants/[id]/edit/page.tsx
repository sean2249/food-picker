'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RestaurantForm } from '@/components/RestaurantForm'
import { Restaurant } from '@/types'

export default function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/restaurants/${id}`)
      .then(r => r.json())
      .then(data => {
        setRestaurant(data)
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (data: Partial<Restaurant>) => {
    await fetch(`/api/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.push('/restaurants')
  }

  if (loading) return <p className="text-center text-muted-foreground">載入中...</p>
  if (!restaurant) return <p className="text-center text-muted-foreground">找不到餐廳</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">編輯餐廳</h1>
      <RestaurantForm
        onSubmit={handleSubmit}
        initialData={restaurant}
        onCancel={() => router.back()}
      />
    </div>
  )
}
