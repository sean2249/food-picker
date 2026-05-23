import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant } from '@/types'
import { generateRestaurantSummary } from '@/lib/ai-summary'
import { normalizeEntityType } from '@/lib/entity-config'

export async function GET(req: NextRequest) {
  const type = normalizeEntityType(req.nextUrl.searchParams.get('type'))
  const db = createServiceClient()
  const { data, error } = await db
    .from('restaurants')
    .select('*')
    .eq('entity_type', type)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = createServiceClient()

  const insert: Partial<Restaurant> = {
    name: body.name,
    mrt_station: body.mrt_station ?? null,
    items: body.items ?? [],
    visited: body.visited ?? false,
    visit_date: body.visit_date ?? null,
    rating: body.rating ?? null,
    review: body.review ?? null,
    tags: body.tags ?? [],
    ai_summary: null,
    entity_type: normalizeEntityType(body.entity_type),
    address: body.address ?? null,
    google_place_id: body.google_place_id ?? null,
    google_maps_url: body.google_maps_url ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
  }

  if (!insert.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data: created, error } = await db
    .from('restaurants')
    .insert(insert)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let finalData = created

  try {
    const generatedSummary = await generateRestaurantSummary({
      items: created.items,
      review: created.review,
      tags: created.tags,
      visited: created.visited,
      entity_type: created.entity_type,
    })

    if (generatedSummary) {
      const { data: withSummary, error: summaryUpdateError } = await db
        .from('restaurants')
        .update({ ai_summary: generatedSummary, updated_at: new Date().toISOString() })
        .eq('id', created.id)
        .select()
        .single()

      if (!summaryUpdateError && withSummary) {
        finalData = withSummary
      }
    }
  } catch (summaryError) {
    console.error('Summary generation failed on create', summaryError)
  }

  return NextResponse.json(finalData, { status: 201 })
}
