import { Restaurant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MapPin } from 'lucide-react'

interface Props {
  restaurant: Restaurant
  onDelete?: (id: string) => void
}

export function RestaurantCard({ restaurant, onDelete }: Props) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
          {restaurant.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{restaurant.rating}</span>
            </div>
          )}
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
        {restaurant.review && (
          <p className="text-sm text-muted-foreground">{restaurant.review}</p>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(restaurant.id)}
            className="mt-2 text-xs text-red-400 hover:text-red-600"
          >
            刪除
          </button>
        )}
      </CardContent>
    </Card>
  )
}
