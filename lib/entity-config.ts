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
    aiSystemPrompt:
      '你是美食推薦助理。從餐廳清單中推薦最合適的最多三家，摘要與標籤是重要因子，以 JSON 回覆。',
    aiUserPromptHint: '請推薦最多三家餐廳，優先考慮相關標籤。',
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
    aiSystemPrompt:
      '你是咖啡推薦助理。從咖啡店清單中推薦最合適的最多三家，摘要與標籤是重要因子，以 JSON 回覆。',
    aiUserPromptHint: '請推薦最多三家咖啡店，優先考慮相關標籤與風味。',
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
