import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant, RecommendResponse } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function getRecommendation(
  item?: string,
  excludeIds: string[] = []
): Promise<RecommendResponse> {
  const db = createServiceClient()

  const { data: allRestaurants, error } = await db
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const restaurants = (allRestaurants as Restaurant[]).filter(
    r => !excludeIds.includes(r.id)
  )

  if (!allRestaurants || allRestaurants.length === 0) {
    return { results: [], reasoning: '目前還沒有任何餐廳紀錄，先去新增幾家吧！' }
  }
  if (restaurants.length === 0) {
    return { results: [], reasoning: '所有餐廳都推薦過了，要不要新增幾家？' }
  }

  const restaurantList = restaurants
    .map((r, i) =>
      `[${i}] ${r.name}` +
      ` | 捷運: ${r.mrt_station ?? '未知'}` +
      ` | 距離評分: ${r.proximity ?? '未填'}(1遠10近)` +
      ` | 品項: ${r.items.length ? r.items.join('、') : '未填'}` +
      ` | 標籤: ${r.tags.length ? r.tags.join('、') : '無'}` +
      ` | 評分: ${r.rating ?? '未吃過'}` +
      ` | ${r.visited ? `已造訪 ${r.visit_date?.slice(0, 10)}` : '未造訪'}` +
      ` | 短評: ${r.review ?? '無'}`
    )
    .join('\n')

  // Static part cached — dynamic part (item) stays uncached
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，距離評分和標籤是重要因子，以 JSON 回覆。',
      },
      {
        type: 'text',
        text: `<restaurants>\n${restaurantList}\n</restaurants>`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `<request>
<item>${item ?? '不限'}</item>
</request>

請推薦最多三家餐廳，優先考慮距離近（高分）和相關標籤。
回覆 JSON，格式如下：
{"indices": [<index1>, <index2>?, <index3>?], "messages": ["<推薦語1>", "<推薦語2>?", "<推薦語3>?"], "reasoning": "<整體推薦原因，1句>"}`,
      },
    ],
  })

  const text = (response.content[0] as { type: 'text'; text: string }).text
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)![0])

  const results = (json.indices as number[])
    .slice(0, 3)
    .map((idx: number, i: number) => ({
      restaurant: restaurants[idx] as Restaurant,
      message: json.messages[i] as string,
    }))
    .filter(r => r.restaurant != null)

  return { results, reasoning: json.reasoning }
}
