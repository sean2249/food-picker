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

  if (loading) {
    return (
      <div className="zakka-content py-10 text-center text-foreground/60">
        載入中…
      </div>
    )
  }
  if (!restaurant) {
    return (
      <div className="zakka-content py-10 text-center text-foreground/60">
        找不到餐廳
      </div>
    )
  }

  return (
    <div className="zakka-content space-y-6 pt-4">
      <header className="space-y-2">
        <h1 className="text-[2rem] leading-[1.1] tracking-tight inline-flex items-center gap-2">
          <BookmarkDot />
          <span>編輯餐廳</span>
        </h1>
        <p className="text-sm text-foreground/65">
          {restaurant.name}
        </p>
      </header>

      {restaurant.ai_summary && (
        <section
          aria-label="AI 摘要（唯讀）"
          className="rounded-2xl bg-card/85 border border-dashed border-border/80 px-4 py-3"
        >
          <div className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] text-foreground/55 mb-1.5">
            <BookmarkDot small />
            <span>AI 摘要（唯讀）</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{restaurant.ai_summary}</p>
        </section>
      )}

      <RestaurantForm
        onSubmit={handleSubmit}
        initialData={restaurant}
        onCancel={() => router.back()}
      />
    </div>
  )
}

function BookmarkDot({ small = false }: { small?: boolean }) {
  const w = small ? 11 : 14
  const h = small ? 13 : 16
  return (
    <svg width={w} height={h} viewBox="0 0 14 16" fill="none" aria-hidden>
      <path d="M2 1.5h10v12l-5-3-5 3v-12Z"
            fill="oklch(0.625 0.175 45 / 0.18)"
            stroke="oklch(0.625 0.175 45)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
