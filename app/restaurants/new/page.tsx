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
    <div className="zakka-content space-y-6 pt-4">
      <header className="space-y-2">
        <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
          <BookmarkDot />
          <span>新增餐廳</span>
        </h1>
        <p className="text-sm text-foreground/65">
          多一頁筆記，下次選擇就更有底
        </p>
      </header>
      <RestaurantForm onSubmit={handleSubmit} onCancel={() => router.back()} />
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
