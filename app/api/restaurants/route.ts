import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant } from '@/types'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('restaurants')
    .select('*')
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
  }

  if (!insert.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await db
    .from('restaurants')
    .insert(insert)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
