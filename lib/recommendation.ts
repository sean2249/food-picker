import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { Mood, Restaurant, RecommendResponse } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function getRecommendation(
  mood: Mood,
  item?: string,
  excludeIds: string[] = []
): Promise<RecommendResponse> {
  const db = createServiceClient()

  const [{ data: allRestaurants, error }, { data: historyRows }] = await Promise.all([
    db.from('restaurants').select('*').order('created_at', { ascending: false }),
    db
      .from('mood_logs')
      .select('mood, created_at, restaurants(name, items)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (error) throw error

  const restaurants = (allRestaurants as Restaurant[]).filter(
    r => !excludeIds.includes(r.id)
  )

  if (!allRestaurants || allRestaurants.length === 0) {
    return { restaurant: null, message: '目前還沒有任何餐廳紀錄，先去新增幾家吧！', reasoning: '' }
  }
  if (restaurants.length === 0) {
    return { restaurant: null, message: '所有餐廳都推薦過了，要不要新增幾家？', reasoning: '' }
  }

  const restaurantList = restaurants
    .map((r, i) =>
      `[${i}] ${r.name} 捷運: ${r.mrt_station ?? '未知'} | ` +
      `品項: ${r.items.length ? r.items.join('、') : '未填'} | ` +
      `評分: ${r.rating ?? '未吃過'} | ${r.visited ? `已造訪 ${r.visit_date?.slice(0, 10)}` : '未造訪'} | ` +
      `短評: ${r.review ?? '無'}`
    )
    .join('\n')

  const historySection = historyRows && historyRows.length > 0
    ? historyRows
        .map((h: { mood: string; created_at: string; restaurants: { name: string; items: string[] }[] | null }) => {
          const r = Array.isArray(h.restaurants) ? h.restaurants[0] : h.restaurants
          return `- 心情「${h.mood}」→ ${r ? `${r.name}（${r.items.join('、')}）` : '無推薦'} [${h.created_at.slice(0, 10)}]`
        })
        .join('\n')
    : '（尚無紀錄）'

  // Static part (restaurant list + history) is marked for prompt caching.
  // Dynamic part (mood/item) stays uncached since it changes every request.
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: [
      {
        type: 'text',
        text: '你是美食推薦助理。根據用戶條件從餐廳清單中推薦最合適的一家，並以 JSON 回覆。',
      },
      {
        type: 'text',
        text: `<restaurants>
${restaurantList}
</restaurants>

<history>
${historySection}
</history>`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `<request>
<mood>${mood}</mood>
<item>${item ?? '不限'}</item>
</request>

請回覆 JSON，格式如下：
{"index": <餐廳 index>,"message": "<推薦語，繁體中文，1-2句>","reasoning": "<原因，繁體中文，1句>"}`,
      },
    ],
  })

  const text = (response.content[0] as { type: 'text'; text: string }).text
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)![0])
  const chosen = restaurants[json.index] as Restaurant

  await db.from('mood_logs').insert({
    restaurant_id: chosen?.id ?? null,
    mood,
  })

  return {
    restaurant: chosen ?? null,
    message: json.message,
    reasoning: json.reasoning,
  }
}
