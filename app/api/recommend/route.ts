import { NextRequest, NextResponse } from 'next/server'
import { getRecommendation } from '@/lib/recommendation'
import { RecommendRequest } from '@/types'

export async function POST(req: NextRequest) {
  const body: RecommendRequest = await req.json()

  if (!body.mood) {
    return NextResponse.json({ error: 'mood is required' }, { status: 400 })
  }

  try {
    const result = await getRecommendation(body.mood, body.item)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
