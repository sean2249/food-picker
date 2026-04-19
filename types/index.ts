export type Mood = 'tired' | 'happy' | 'sad' | 'stressed' | 'excited' | 'neutral'

export interface Restaurant {
  id: string
  name: string
  mrt_station: string | null
  items: string[]             // specific dishes, e.g. ['提拉米蘇', '焦糖拿鐵']
  visited: boolean
  visit_date: string | null
  rating: number | null       // 1-5
  review: string | null
  created_at: string
  updated_at: string
}

export interface MoodLog {
  id: string
  restaurant_id: string | null
  mood: Mood
  created_at: string
}

export interface RecommendRequest {
  mood: Mood
  item?: string               // specific dish the user wants
}

export interface RecommendResponse {
  restaurant: Restaurant | null
  message: string
  reasoning: string
}
