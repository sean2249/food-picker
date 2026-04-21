'use client'
import { useEffect, useState } from 'react'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RecommendResponse } from '@/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

const PROXIMITY_LABELS: Record<number, string> = {
  1: '走路 5 分鐘',
  2: '走路 15 分鐘',
  3: '走路 30 分鐘',
  4: '搭車 15 分鐘',
  5: '搭車快一小時',
  6: '搭車一小時以上',
  7: '開車才方便',
  8: '跨縣市',
  9: '台灣另一端',
  10: '出國的',
}

export default function RecommendPage() {
  const [item, setItem] = useState('')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visitedFilter, setVisitedFilter] = useState<'all' | 'visited' | 'unvisited'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [maxProximity, setMaxProximity] = useState(10)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then((data: { tags?: string[] }[]) => {
        const tags = Array.from(new Set(data.flatMap(r => r.tags ?? [])))
        setAllTags(tags)
      })
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleRecommend = async () => {
    setLoading(true)
    setResult(null)
    setChosen(null)
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item: item || undefined,
        visited_filter: visitedFilter,
        tags: selectedTags.length ? selectedTags : undefined,
        max_proximity: maxProximity < 10 ? maxProximity : undefined,
      }),
    })
    const data = await res.json()
    setResult(data)
    setFiltersOpen(true)
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
        <Label>說些什麼，讓我來幫你找餐廳!</Label>
        <Input
          value={item}
          onChange={e => setItem(e.target.value)}
          placeholder="例：我想要包子、今天心情如何"
        />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span>篩選條件</span>
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 space-y-4 border-t">
            <div className="pt-4">
              <Label className="text-xs text-muted-foreground">已造訪</Label>
              <div className="flex gap-3 mt-1">
                {([['all', '全部'], ['unvisited', '只推未造訪'], ['visited', '只推已造訪']] as const).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="visited_filter"
                      value={val}
                      checked={visitedFilter === val}
                      onChange={() => setVisitedFilter(val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">標籤（不選 = 不限）</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">
                距離上限：{maxProximity === 10 ? '不限' : PROXIMITY_LABELS[maxProximity]}
              </Label>
              <input
                type="range"
                min={1}
                max={10}
                value={maxProximity}
                onChange={e => setMaxProximity(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleRecommend} disabled={loading} className="w-full" size="lg">
        {loading ? '推薦中...' : '推薦給我！'}
      </Button>

      {result && (
        <div className="space-y-4 pt-2 border-t">
          <Button
            onClick={handleRecommend}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? '推薦中...' : '調整篩選後重新推薦'}
          </Button>
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
