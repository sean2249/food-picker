import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { review, name, items } = await req.json()

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
          content: `根據以下餐廳資訊，生成 3-5 個簡短的繁體中文標籤（每個標籤 2-4 字）。
只回覆 JSON 陣列，例如：["咖啡廳", "甜點", "適合約會"]

餐廳：${name}
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
