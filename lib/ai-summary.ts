import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SummaryInput {
  items?: string[] | null
  review?: string | null
  tags?: string[] | null
  visited?: boolean | null
}

export function createSummaryParts(input: SummaryInput): string {
  const parts = [
    input.visited == null ? null : input.visited ? '狀態：已造訪' : '狀態：未造訪',
    input.items?.length ? `品項：${input.items.join('、')}` : null,
    input.tags?.length ? `標籤：${input.tags.join('、')}` : null,
    input.review?.trim() ? `短評：${input.review.trim()}` : null,
  ].filter(Boolean)

  return parts.join('；')
}

export async function generateRestaurantSummary(input: SummaryInput): Promise<string | null> {
  const parts = createSummaryParts(input)
  if (!parts) {
    return null
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `根據以下資訊，用一句話描述這家餐廳的特色（繁體中文，不超過50字）：${parts}`,
      },
    ],
  })

  const content = response.content[0]
  if (!content || content.type !== 'text') {
    return null
  }

  return content.text.trim() || null
}

export function areStringArraysEqual(a?: string[] | null, b?: string[] | null): boolean {
  const aa = (a ?? []).map(v => v.trim()).sort()
  const bb = (b ?? []).map(v => v.trim()).sort()

  if (aa.length !== bb.length) return false

  return aa.every((value, index) => value === bb[index])
}
