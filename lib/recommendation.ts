import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { Restaurant, RecommendResponse, EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function getRecommendation(
  item?: string,
  excludeIds: string[] = [],
  preFiltered?: Restaurant[],
  entityType: EntityType = 'restaurant'
): Promise<RecommendResponse> {
  const config = ENTITY_CONFIG[entityType]
  let restaurants: Restaurant[]

  if (preFiltered) {
    restaurants = preFiltered.filter(r => !excludeIds.includes(r.id))
  } else {
    const db = createServiceClient()
    const { data: allRestaurants, error } = await db
      .from('restaurants')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!allRestaurants || allRestaurants.length === 0) {
      const emptyMsg =
        entityType === 'cafe'
          ? '咖啡本子上還是空白的，先去新增幾家吧！'
          : '目前還沒有任何餐廳紀錄，先去新增幾家吧！'
      return { results: [], reasoning: emptyMsg }
    }
    restaurants = (allRestaurants as Restaurant[]).filter(r => !excludeIds.includes(r.id))
  }

  if (restaurants.length === 0) {
    return { results: [], reasoning: '沒有符合條件的選項，試試調整篩選條件？' }
  }

  const restaurantList = restaurants
    .map((r, i) =>
      `[${i}] ${r.name}` +
      ` | 摘要: ${r.ai_summary ?? '無'}` +
      ` | 標籤: ${r.tags.length ? r.tags.join('、') : '無'}` +
      ` | 評語: ${r.review ?? '無'}` +
      ` | 品項: ${r.items.length ? r.items.join('、') : '未填'}` +
      ` | 捷運: ${r.mrt_station ?? '未知'}` +
      ` | 評分: ${r.rating ?? '未吃過'}` +
      ` | ${r.visited ? '已造訪' : '未造訪'}`
    )
    .join('\n')

  const listTag = entityType === 'cafe' ? 'cafes' : 'restaurants'

  // Static part cached — dynamic part (item) stays uncached.
  // System prompt varies per entity type, creating one cache per type.
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: config.aiSystemPrompt,
      },
      {
        type: 'text',
        text: `<${listTag}>\n${restaurantList}\n</${listTag}>`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `<request>
<item>${item ?? '不限'}</item>
</request>

${config.aiUserPromptHint}
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
