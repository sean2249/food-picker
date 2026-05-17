export type EntityType = 'restaurant' | 'cafe'

export interface Restaurant {
  id: string
  name: string
  mrt_station: string | null
  items: string[]
  visited: boolean
  visit_date: string | null
  rating: number | null       // 1-5
  review: string | null
  tags: string[]
  ai_summary: string | null
  entity_type: EntityType
  created_at: string
  updated_at: string
}

export interface RecommendRequest {
  item?: string
  visited_filter?: 'all' | 'visited' | 'unvisited'
  tags?: string[]
  mrt_line?: string       // filter to restaurants whose station belongs to this line
  mrt_station?: string    // filter to restaurants at this exact station
  entity_type?: EntityType
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
  entity_type?: EntityType
}
