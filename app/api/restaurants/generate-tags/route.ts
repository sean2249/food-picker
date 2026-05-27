import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ENTITY_CONFIG, normalizeEntityType } from '@/lib/entity-config'
import { requireAdmin } from '@/lib/admin-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  const { review, name, items, entity_type } = await req.json()
  const config = ENTITY_CONFIG[normalizeEntityType(entity_type)]

  if (!review?.trim()) {
    return NextResponse.json({ error: 'review is required' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `${config.tagGenHint}
只回覆 JSON 陣列，例如：${config.tagGenExample}

${config.label}：${name}
品項：${items?.join('、') ?? '未填'}
短評：${review}`,
        },
      ],
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text
    const tags = JSON.parse(text.match(/\[[\s\S]*\]/)![0]) as string[]
    return NextResponse.json({ tags })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
