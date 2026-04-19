'use client'
import { useRouter } from 'next/navigation'
import { RestaurantForm } from '@/components/RestaurantForm'
import { Restaurant } from '@/types'

export default function NewRestaurantPage() {
  const router = useRouter()

  const handleSubmit = async (data: Partial<Restaurant>) => {
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) router.push('/restaurants')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新增餐廳</h1>
      <RestaurantForm onSubmit={handleSubmit} />
    </div>
  )
}
