import { NextRequest, NextResponse } from 'next/server'
import { getPlaceDetails, isPlacesConfigured } from '@/lib/places'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  if (!isPlacesConfigured()) {
    return NextResponse.json({ error: 'Google Maps 未設定' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const placeId = typeof body.place_id === 'string' ? body.place_id : ''

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 })
  }

  try {
    const detail = await getPlaceDetails(placeId)
    return NextResponse.json(detail)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
