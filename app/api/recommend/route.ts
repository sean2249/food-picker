import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getRecommendation } from '@/lib/recommendation'
import { RecommendRequest, Restaurant } from '@/types'

export async function POST(req: NextRequest) {
  const body: RecommendRequest = await req.json()

  try {
    const db = createServiceClient()
    const { data: allRestaurants, error } = await db
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    let filtered = (allRestaurants ?? []) as Restaurant[]

    if (body.visited_filter === 'visited') {
      filtered = filtered.filter(r => r.visited)
    } else if (body.visited_filter === 'unvisited') {
      filtered = filtered.filter(r => !r.visited)
    }

    if (body.tags?.length) {
      filtered = filtered.filter(r =>
        body.tags!.some(t => r.tags.includes(t))
      )
    }

    if (body.max_proximity != null) {
      filtered = filtered.filter(r =>
        r.proximity == null || r.proximity <= body.max_proximity!
      )
    }

    const result = await getRecommendation(body.item, [], filtered)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
