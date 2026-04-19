import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { FeedbackRequest } from '@/types'

export async function POST(req: NextRequest) {
  const body: FeedbackRequest = await req.json()

  if (!body.chosen_restaurant_id || !body.shown_restaurant_ids?.length) {
    return NextResponse.json({ error: 'chosen_restaurant_id and shown_restaurant_ids are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('recommendation_logs').insert({
    chosen_restaurant_id: body.chosen_restaurant_id,
    shown_restaurant_ids: body.shown_restaurant_ids,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
