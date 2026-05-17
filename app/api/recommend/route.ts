import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getRecommendation } from '@/lib/recommendation'
import { RecommendRequest, Restaurant } from '@/types'
import { normalizeEntityType } from '@/lib/entity-config'
import { getLinesForStation, MrtLineId } from '@/lib/mrt-stations'

export async function POST(req: NextRequest) {
  const body: RecommendRequest = await req.json()
  const entityType = normalizeEntityType(body.entity_type)

  try {
    const db = createServiceClient()
    const { data: allRestaurants, error } = await db
      .from('restaurants')
      .select('*')
      .eq('entity_type', entityType)
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

    if (body.mrt_line) {
      const lineId = body.mrt_line as MrtLineId
      filtered = filtered.filter(r => getLinesForStation(r.mrt_station).includes(lineId))
    }

    if (body.mrt_station) {
      filtered = filtered.filter(r => r.mrt_station === body.mrt_station)
    }

    const result = await getRecommendation(body.item, [], filtered, entityType)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
