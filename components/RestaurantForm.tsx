'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { Restaurant } from '@/types'

interface Props {
  onSubmit: (data: Partial<Restaurant>) => Promise<void>
}

export function RestaurantForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [mrtStation, setMrtStation] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [itemInput, setItemInput] = useState('')
  const [visited, setVisited] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const trimmed = itemInput.trim()
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed])
      setItemInput('')
    }
  }

  const removeItem = (item: string) => {
    setItems(prev => prev.filter(i => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem() }
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
        <Label>品項</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
                  className={`w-10 h-10 rounded-full border text-sm font-medium ${rating === n ? 'bg-primary text-primary-foreground' : 'border-border'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>短評</Label>
            <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="口感如何？推薦指數？" />
          </div>
        </>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '儲存中...' : '新增餐廳'}
      </Button>
    </form>
  )
}
