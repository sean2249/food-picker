import { NextRequest, NextResponse } from 'next/server'
import { autocompletePlaces, isPlacesConfigured } from '@/lib/places'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  if (!isPlacesConfigured()) {
    return NextResponse.json({ error: 'Google Maps 未設定' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const input = typeof body.input === 'string' ? body.input : ''

  try {
    const suggestions = await autocompletePlaces(input)
    return NextResponse.json({ suggestions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
