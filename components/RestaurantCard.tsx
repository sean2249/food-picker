 'use client'
import { useState } from 'react'
import { Restaurant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import Link from 'next/link'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
}

function ProximityIcon({ score }: { score: number }) {
  // proximity scale: 1 = very close (walking), 10 = far (overseas)
  if (score <= 3) return <span aria-label="步行距離">🦶</span>
  if (score <= 6) return <span aria-label="搭車距離">🚇</span>
  if (score <= 7) return <span aria-label="開車距離">🚗</span>
  if (score <= 9) return <span aria-label="高鐵距離">🚄</span>
  return <span aria-label="飛機距離">✈️</span>
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <Card className={`w-full relative overflow-hidden ${isChosen ? 'ring-2 ring-brand' : ''}`}>
      {restaurant.visited && (
        <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full border-2 border-brand flex items-center justify-center -rotate-12 shrink-0 z-10">
          <span className="text-[9px] font-black text-brand text-center leading-tight select-none">{'已\n訪'}</span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className={`flex items-start justify-between ${restaurant.visited ? 'pl-11' : ''}`}>
          <div>
            <CardTitle className="text-base font-bold">{restaurant.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {restaurant.proximity && (
              <div className="flex items-center gap-1 text-brand">
                <ProximityIcon score={restaurant.proximity} />
                <span className="text-sm font-medium">{restaurant.proximity}/10</span>
              </div>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-brand">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{restaurant.rating}</span>
              </div>
            )}
          </div>
        </div>
        {restaurant.mrt_station && (
          <div className="text-xs text-muted-foreground mt-0.5">
            📍 {restaurant.mrt_station}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.tags.map(tag => (
              <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        {restaurant.review && (
          <p className="text-sm text-muted-foreground italic">{restaurant.review}</p>
        )}
        <div className="flex gap-2 mt-3 items-center">
          {onChoose && (
            <Button
              size="sm"
              onClick={onChoose}
              className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90 font-bold"
            >
              🍜 就選這家！
            </Button>
          )}
          {isChosen && (
            <span className="text-sm text-brand font-medium self-center">✓ 已選擇</span>
          )}
          {onDelete && (
            <Link href={`/restaurants/${restaurant.id}/edit`}>
              <Button variant="ghost" size="sm" className="py-2 px-3 text-sm">
                編輯
              </Button>
            </Link>
          )}
          {onDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="py-2 px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              刪除
            </button>
          )}
          {confirmingDelete && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">確定？</span>
              <button
                onClick={() => { onDelete!(restaurant.id); setConfirmingDelete(false) }}
                className="font-bold text-destructive py-1 px-2"
              >
                是
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-muted-foreground py-1 px-2"
              >
                否
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
