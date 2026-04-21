import { NextRequest, NextResponse } from 'next/server'
import { createSummaryParts, generateRestaurantSummary } from '@/lib/ai-summary'

export async function POST(req: NextRequest) {
  const { items, review, tags, visited } = await req.json()

  const parts = createSummaryParts({
    items: items as string[] | null,
    review: review as string | null,
    tags: tags as string[] | null,
    visited: typeof visited === 'boolean' ? visited : null,
  })

  if (!parts) {
    return NextResponse.json({ error: 'At least one of items, review, tags, or visited is required' }, { status: 400 })
  }

  try {
    const ai_summary = await generateRestaurantSummary({
      items: items as string[] | null,
      review: review as string | null,
      tags: tags as string[] | null,
      visited: typeof visited === 'boolean' ? visited : null,
    })

    return NextResponse.json({ ai_summary })
  } catch (error) {
    console.error('Summary generation endpoint failed', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
