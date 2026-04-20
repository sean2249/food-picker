export interface Restaurant {
  id: string
  name: string
  mrt_station: string | null
  items: string[]
  visited: boolean
  visit_date: string | null
  rating: number | null       // 1-5
  review: string | null
  proximity: number | null    // 1-10 (1=closest, 10=farthest per new UI labeling)
  tags: string[]
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export interface RecommendRequest {
  item?: string
  visited_filter?: 'all' | 'visited' | 'unvisited'
  tags?: string[]
  max_proximity?: number  // exclude restaurants with proximity > this value
}

export interface RecommendResult {
  restaurant: Restaurant
  message: string
}

export interface RecommendResponse {
  results: RecommendResult[]
  reasoning: string
}

export interface FeedbackRequest {
  chosen_restaurant_id: string
  shown_restaurant_ids: string[]
}
