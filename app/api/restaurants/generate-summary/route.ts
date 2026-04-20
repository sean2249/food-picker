import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { items, review, tags } = await req.json()

  const parts = [
    items?.length ? `品項：${(items as string[]).join('、')}` : null,
    tags?.length ? `標籤：${(tags as string[]).join('、')}` : null,
    review ? `短評：${review}` : null,
  ].filter(Boolean).join('；')

  if (!parts) {
    return NextResponse.json({ error: 'At least one of items, review, or tags is required' }, { status: 400 })
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `根據以下資訊，用一句話描述這家餐廳的特色（繁體中文，不超過30字）：${parts}`,
    }],
  })

  const ai_summary = (response.content[0] as { type: 'text'; text: string }).text.trim()
  return NextResponse.json({ ai_summary })
}
