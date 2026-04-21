import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { areStringArraysEqual, generateRestaurantSummary } from '@/lib/ai-summary'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const db = createServiceClient()

  const { data: existing, error: fetchError } = await db
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? 'restaurant not found' }, { status: 404 })
  }

  const { ai_summary: _ignoredAiSummary, ...sanitizedBody } = body
  void _ignoredAiSummary

  const updates = {
    ...sanitizedBody,
    updated_at: new Date().toISOString(),
  }

  const nextReview = body.review ?? existing.review
  const nextVisited = body.visited ?? existing.visited
  const nextTags = body.tags ?? existing.tags
  const nextItems = body.items ?? existing.items

  const shouldRegenerateSummary =
    nextReview !== existing.review ||
    nextVisited !== existing.visited ||
    !areStringArraysEqual(nextTags, existing.tags) ||
    !areStringArraysEqual(nextItems, existing.items)

  const { data: updated, error } = await db
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let finalData = updated

  if (shouldRegenerateSummary) {
    try {
      const generatedSummary = await generateRestaurantSummary({
        items: nextItems,
        review: nextReview,
        tags: nextTags,
        visited: nextVisited,
      })

      const { data: withSummary, error: summaryUpdateError } = await db
        .from('restaurants')
        .update({ ai_summary: generatedSummary, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (!summaryUpdateError && withSummary) {
        finalData = withSummary
      }
    } catch (summaryError) {
      console.error('Summary generation failed on patch', summaryError)
    }
  }

  return NextResponse.json(finalData)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()
  const { error } = await db.from('restaurants').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
