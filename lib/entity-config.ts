import type { EntityType } from '@/types'

interface EntityConfig {
  label: string
  shortLabel: string
  listTitle: string
  listSubtitle: string
  newTitle: string
  newSubtitle: string
  editTitle: string
  recommendTitle: string
  recommendSubtitle: string
  emptyHint: string
  itemFieldLabel: string
  itemPlaceholder: string
  chooseCTA: string
  recommendCTA: string
  recommendLoading: string
  basePath: string
  recommendPath: string
  newPath: string
  listPath: string
  aiSystemPrompt: string
  aiUserPromptHint: string
  tagGenHint: string
  tagGenExample: string
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  restaurant: {
    label: '餐廳',
    shortLabel: '餐廳',
    listTitle: '餐廳清單',
    listSubtitle: '翻翻你蒐藏的小店本',
    newTitle: '新增餐廳',
    newSubtitle: '多一頁筆記，下次選擇就更有底',
    editTitle: '編輯餐廳',
    recommendTitle: '推薦給我',
    recommendSubtitle: '說一句你今天想吃什麼，我幫你挑三家',
    emptyHint: '本子上還是空白的',
    itemFieldLabel: '想吃什麼？也可以說說心情',
    itemPlaceholder: '例：我想要包子、今天有點累',
    chooseCTA: '就選這家',
    recommendCTA: '推薦給我！',
    recommendLoading: '正在挑…',
    basePath: '/restaurants',
    recommendPath: '/restaurants/recommend',
    newPath: '/restaurants/new',
    listPath: '/restaurants',
    aiSystemPrompt: `你是使用者私人「美食筆記」的好朋友 — 這份清單是他自己一家家記下來的店。他餓了拿手機問你「吃什麼」，你的工作是從清單裡挑最多三家，給他一個不急不躁、像朋友傳訊息的回覆。

口吻：
- 用繁體中文，像在 LINE 聊天 — 短句、口語、有生活感
- 溫暖但不浮誇，不要用「以下」「根據您的」「為您推薦」這類客服語
- 善用清單裡的線索說重點：上次的評分、具體品項、tag、捷運站、最後造訪時間
- 對「沒去過」的店，可以用「還沒吃過、看起來合你今天的胃口」這類語氣

從下方餐廳清單中挑最多三家，依使用者指定的 JSON 格式回覆。`,
    aiUserPromptHint: `幫忙挑最多三家。每則推薦語一句話、30 字以內，不重複店名 — 講最具體的記憶點（評分、品項、tag、捷運站、上次吃的感受、未造訪的期待感）。

範例：「上次給五星的酸辣粉，今天剛好下雨」「中山站走兩分鐘，tag 寫了你愛的義式」「還沒吃過，看起來合你想吃辣的胃口」。

reasoning：一句話交代你整體怎麼挑（範例：「三家都走得到，又都有辣的選項」），不客套。`,
    tagGenHint:
      '根據以下餐廳資訊，生成 3-7 個簡短的繁體中文標籤（每個標籤 2-4 字）。',
    tagGenExample: '["咖啡廳", "甜點", "適合約會"]',
  },
  cafe: {
    label: '咖啡廳',
    shortLabel: '咖啡',
    listTitle: '咖啡清單',
    listSubtitle: '翻翻你蒐藏的咖啡角落',
    newTitle: '新增咖啡店',
    newSubtitle: '多一頁筆記，下次想喝就更有頭緒',
    editTitle: '編輯咖啡店',
    recommendTitle: '推薦給我',
    recommendSubtitle: '說一句你今天想喝什麼，我幫你挑三家',
    emptyHint: '咖啡本子上還是空白的',
    itemFieldLabel: '想喝什麼？也可以說說心情',
    itemPlaceholder: '例：想喝拿鐵、想找深烘的、有點想坐久一點',
    chooseCTA: '就喝這家',
    recommendCTA: '推薦給我！',
    recommendLoading: '正在挑…',
    basePath: '/cafes',
    recommendPath: '/cafes/recommend',
    newPath: '/cafes/new',
    listPath: '/cafes',
    aiSystemPrompt: `你是使用者私人「咖啡筆記」的好朋友 — 這份清單是他自己一家家記下來的店。他想找地方坐坐拿手機問你，你的工作是從清單裡挑最多三家，給他一個慢一點、像朋友傳訊息的回覆。

口吻：
- 用繁體中文，像在 LINE 聊天 — 短句、口語、有生活感
- 溫暖但不浮誇，不要用「以下」「根據您的」「為您推薦」這類客服語
- 善用清單裡的線索說重點：上次的評分、品項風味、tag、捷運站、最後造訪時間
- 對「沒去過」的店，可以用「還沒喝過、感覺今天會喜歡」這類語氣

從下方咖啡店清單中挑最多三家，依使用者指定的 JSON 格式回覆。`,
    aiUserPromptHint: `幫忙挑最多三家。每則推薦語一句話、30 字以內，不重複店名 — 講最具體的記憶點（評分、品項風味、tag、捷運站、上次去的感受、未造訪的期待感）。

範例：「上次給五星的衣索比亞，配酸度剛好」「中山站走兩分鐘，tag 寫了深烘」「還沒喝過，感覺合你今天想坐久的心情」。

reasoning：一句話交代你整體怎麼挑（範例：「三家環境都適合坐久一點，距離也近」），不客套。`,
    tagGenHint:
      '根據以下咖啡店資訊，生成 3-7 個簡短的繁體中文標籤（每個標籤 2-4 字），用咖啡相關詞彙（例：手沖、深烘、義式、第三波、適合工作）。',
    tagGenExample: '["手沖", "深烘", "第三波"]',
  },
}

export function isValidEntityType(value: unknown): value is EntityType {
  return value === 'restaurant' || value === 'cafe'
}

export function normalizeEntityType(value: unknown): EntityType {
  return isValidEntityType(value) ? value : 'restaurant'
}
