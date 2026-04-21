'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Restaurant } from '@/types'

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

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
  initialData?: Restaurant
  onCancel?: () => void
}

export function RestaurantForm({ onSubmit, initialData, onCancel }: Props) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [mrtStation, setMrtStation] = useState(initialData?.mrt_station ?? '')
  const [items] = useState<string[]>(initialData?.items ?? [])
  const [visited, setVisited] = useState(initialData?.visited ?? false)
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null)
  const [review, setReview] = useState(initialData?.review ?? '')
  const [proximity, setProximity] = useState<number>(initialData?.proximity ?? 5)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [generatingTags, setGeneratingTags] = useState(false)
  const [loading, setLoading] = useState(false)

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  const handleGenerateTags = async () => {
    if (!review.trim()) return
    setGeneratingTags(true)
    const res = await fetch('/api/restaurants/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review, name, items }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags(data.tags ?? [])
    }
    setGeneratingTags(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSubmit({
      name: name.trim(),
      mrt_station: mrtStation.trim() || null,
      items,
      visited,
      rating: visited ? rating : null,
      review: review.trim() || null,
      proximity,
      tags,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>店名 *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="餐廳名稱" required />
      </div>
      <div>
        <Label>捷運站</Label>
        <Input value={mrtStation} onChange={e => setMrtStation(e.target.value)} placeholder="例：大安、信義安和" />
      </div>
      <div>
        <Label>距離</Label>
        <div className="mt-2 space-y-1">
          <input
            type="range"
            min={1}
            max={10}
            value={proximity}
            onChange={e => setProximity(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">{PROXIMITY_LABELS[proximity]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="visited" checked={visited} onChange={e => setVisited(e.target.checked)} />
        <Label htmlFor="visited">已造訪</Label>
      </div>
      {visited && (
        <div>
          <Label>評分 (1-5)</Label>
          <div className="flex gap-2 mt-1">
            {[1,2,3,4,5].map(n => (
              <button type="button" key={n} onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-full border text-sm font-medium ${
                  rating === n ? 'bg-primary text-primary-foreground' : 'border-border'
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label>共用欄位：未去過的備註 & 去過的短評</Label>
        <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="這家聽說什麼好吃？吃過的人怎麼說？你會怎麼跟別人介紹這家餐廳" />
        {review.trim() && (
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateTags}
              disabled={generatingTags}
            >
              {generatingTags ? '生成標籤中...' : '建議標籤'}
            </Button>
          </div>
        )}
      </div>
      <div>
        <Label>標籤</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                X
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="手動新增標籤（Enter）"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag}>新增</Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增餐廳'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
        )}
      </div>
    </form>
  )
}
