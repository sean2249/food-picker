'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
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
}

export function RestaurantForm({ onSubmit, initialData }: Props) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [mrtStation, setMrtStation] = useState(initialData?.mrt_station ?? '')
  const [items, setItems] = useState<string[]>(initialData?.items ?? [])
  const [itemInput, setItemInput] = useState('')
  const [visited, setVisited] = useState(initialData?.visited ?? false)
  const [visitDate, setVisitDate] = useState(
    initialData?.visit_date ? initialData.visit_date.slice(0, 10) : ''
  )
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null)
  const [review, setReview] = useState(initialData?.review ?? '')
  const [proximity, setProximity] = useState<number>(initialData?.proximity ?? 5)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [aiSummary, setAiSummary] = useState(initialData?.ai_summary ?? '')
  const [generatingTags, setGeneratingTags] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const trimmed = itemInput.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
      setItemInput('')
    }
  }

  const removeItem = (item: string) => setItems(prev => prev.filter(i => i !== item))

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
  }

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

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true)
    const res = await fetch('/api/restaurants/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, review: review.trim() || null, tags }),
    })
    if (res.ok) {
      const data = await res.json()
      setAiSummary(data.ai_summary ?? '')
    }
    setGeneratingSummary(false)
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
      visit_date: visited && visitDate ? new Date(visitDate).toISOString() : null,
      rating: visited ? rating : null,
      review: review.trim() || null,
      proximity,
      tags,
      ai_summary: aiSummary.trim() || null,
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
      <div>
        <Label>品項</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={handleItemKeyDown}
            placeholder="例：提拉米蘇、焦糖拿鐵（Enter 新增）"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addItem}>新增</Button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {items.map(item => (
              <span key={item}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground">
                {item}
                <button type="button" onClick={() => removeItem(item)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="visited" checked={visited} onChange={e => setVisited(e.target.checked)} />
        <Label htmlFor="visited">已造訪</Label>
      </div>
      {visited && (
        <>
          <div>
            <Label>造訪日期</Label>
            <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
          </div>
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
          <div>
            <Label>短評</Label>
            <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="口感如何？推薦指數？" />
            <div className="flex gap-2 mt-2">
              {review.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTags}
                  disabled={generatingTags}
                >
                  {generatingTags ? '生成標籤中...' : '建議標籤'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
              >
                {generatingSummary ? '生成中...' : '生成 AI 摘要'}
              </Button>
            </div>
          </div>
          <div>
            <Label>標籤</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
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
          <div>
            <Label>AI 摘要</Label>
            <Textarea
              value={aiSummary}
              onChange={e => setAiSummary(e.target.value)}
              placeholder="點「生成 AI 摘要」自動填寫，也可手動編輯"
              rows={2}
            />
          </div>
        </>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增餐廳'}
      </Button>
    </form>
  )
}
