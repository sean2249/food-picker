'use client'
import { useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RecommendResponse } from '@/types'

export default function RecommendPage() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const handleRecommend = async () => {
    setLoading(true)
    setResult(null)
    setChosen(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: item || undefined }),
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
      }),
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">推薦給我</h1>

      <div>
        <Label>想吃什麼品項（可留空）</Label>
        <Input
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：提拉米蘇、肉桂捲"
        />
      </div>

      <Button onClick={handleRecommend} disabled={loading} className="w-full" size="lg">
        {loading ? '推薦中...' : '推薦給我！'}
      </Button>

      {result && (
        <div className="space-y-4 pt-2 border-t">
          {result.reasoning && (
            <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </div>
          )}

          {result.results.length === 0 && (
            <p className="text-muted-foreground text-center">暫時沒有合適的推薦</p>
          )}

          {result.results.map(({ restaurant, message }) => (
            <div key={restaurant.id} className="space-y-2">
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/20">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <RestaurantCard
                restaurant={restaurant}
                onChoose={chosen ? undefined : () => handleChoose(restaurant.id)}
                isChosen={chosen === restaurant.id}
              />
            </div>
          ))}

          {chosen && (
            <p className="text-center text-sm text-muted-foreground">已記錄你的選擇！</p>
          )}
        </div>
      )}
    </div>
  )
}
