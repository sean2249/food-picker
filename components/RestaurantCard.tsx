import { Restaurant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Navigation } from 'lucide-react'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
  onChoose?: () => void
  isChosen?: boolean
}

export function RestaurantCard({ restaurant, onDelete, onChoose, isChosen }: Props) {
  return (
    <Card className={`w-full ${isChosen ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
          <div className="flex items-center gap-2">
            {restaurant.proximity && (
              <div className="flex items-center gap-1 text-blue-500">
                <Navigation className="h-4 w-4" />
                <span className="text-sm font-medium">{restaurant.proximity}/10</span>
              </div>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{restaurant.rating}</span>
              </div>
            )}
          </div>
        </div>
        {restaurant.mrt_station && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {restaurant.mrt_station}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-2">
          {restaurant.items.map(item => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
          {!restaurant.visited && (
            <Badge variant="outline">未造訪</Badge>
          )}
        </div>
        {restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.tags.map(tag => (
              <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        {restaurant.review && (
          <p className="text-sm text-muted-foreground">{restaurant.review}</p>
        )}
        <div className="flex gap-2 mt-2">
          {onChoose && (
            <Button size="sm" onClick={onChoose} className="flex-1">
              就選這家！
            </Button>
          )}
          {isChosen && (
            <span className="text-sm text-primary font-medium self-center">✓ 已選擇</span>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(restaurant.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              刪除
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
