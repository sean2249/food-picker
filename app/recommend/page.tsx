'use client'
import { useState } from 'react'
import { MoodSelector } from '@/components/MoodSelector'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mood, Restaurant } from '@/types'

interface RecommendResult {
  restaurant: Restaurant | null
  message: string
  reasoning: string
}

export default function RecommendPage() {
  const [mood, setMood] = useState<Mood | null>(null)
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRecommend = async () => {
    if (!mood) return
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, item: item || undefined }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">推薦給我</h1>

      <div>
        <Label className="text-base mb-2 block">你現在的心情？</Label>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <Label>想吃什麼品項（可留空）</Label>
        <Input
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：提拉米蘇、肉桂捲"
        />
      </div>

      <Button onClick={handleRecommend} disabled={!mood || loading} className="w-full" size="lg">
        {loading ? '推薦中...' : '推薦給我！'}
      </Button>

      {result && (
        <div className="space-y-4 pt-2 border-t">
          <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
            <p className="font-medium">{result.message}</p>
            {result.reasoning && (
              <p className="text-sm text-muted-foreground mt-1">{result.reasoning}</p>
            )}
          </div>
          {result.restaurant && (
            <RestaurantCard restaurant={result.restaurant} />
          )}
        </div>
      )}
    </div>
  )
}
