import { Telegraf, Markup, Context } from 'telegraf'
import { getRecommendation } from '@/lib/recommendation'
import { createServiceClient } from '@/lib/supabase'
import { Mood, Restaurant } from '@/types'

const MOOD_KEYBOARD = Markup.keyboard([
  ['😴 很累', '😊 開心', '😢 難過'],
  ['😤 壓力大', '🎉 興奮', '😐 普通'],
]).resize()

const MOOD_MAP: Record<string, Mood> = {
  '😴 很累': 'tired',
  '😊 開心': 'happy',
  '😢 難過': 'sad',
  '😤 壓力大': 'stressed',
  '🎉 興奮': 'excited',
  '😐 普通': 'neutral',
}

type BotSession = {
  awaitingMood?: boolean
  awaitingFoodType?: boolean
  awaitingRestaurantName?: boolean
  mood?: Mood
  lastRecommendedId?: string
  lastMood?: Mood
  excludeIds?: string[]
}

async function getSession(userId: number): Promise<BotSession> {
  const db = createServiceClient()
  const { data } = await db
    .from('telegram_sessions')
    .select('session')
    .eq('user_id', userId)
    .single()
  return (data?.session as BotSession) ?? {}
}

async function saveSession(userId: number, session: BotSession): Promise<void> {
  const db = createServiceClient()
  await db.from('telegram_sessions').upsert(
    { user_id: userId, session, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

async function clearSession(userId: number): Promise<void> {
  const db = createServiceClient()
  await db.from('telegram_sessions').delete().eq('user_id', userId)
}

export function createBot(token: string) {
  const bot = new Telegraf(token)

  bot.start(ctx => {
    ctx.reply(
      '嗨！我是你的美食選擇器 🍰\n\n' +
      '指令：\n/hungry - 我餓了！推薦我\n/add - 新增餐廳\n/list - 查看餐廳清單',
      MOOD_KEYBOARD
    )
  })

  bot.command('hungry', async ctx => {
    await saveSession(ctx.from!.id, { awaitingMood: true })
    ctx.reply('你現在的心情如何？', MOOD_KEYBOARD)
  })

  bot.command('add', async ctx => {
    await saveSession(ctx.from!.id, { awaitingRestaurantName: true })
    ctx.reply('餐廳叫什麼名字？', Markup.removeKeyboard())
  })

  bot.command('list', async ctx => {
    const db = createServiceClient()
    const { data } = await db
      .from('restaurants')
      .select('name, items, rating, visited')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!data || data.length === 0) {
      return ctx.reply('還沒有餐廳紀錄！用 /add 新增第一家。')
    }

    const list = data
      .map((r: Partial<Restaurant>) =>
        `${r.visited ? '✅' : '📍'} *${r.name}*\n` +
        `品項：${(r.items ?? []).join('、') || '未填'}` +
        (r.rating ? ` | ⭐ ${r.rating}` : '')
      )
      .join('\n\n')

    ctx.reply(list, { parse_mode: 'Markdown' })
  })

  bot.on('text', async ctx => {
    const text = ctx.message.text
    const userId = ctx.from!.id
    const session = await getSession(userId)

    if (session.awaitingMood || Object.keys(MOOD_MAP).includes(text)) {
      const mood = MOOD_MAP[text]
      if (mood) {
        await saveSession(userId, { awaitingFoodType: true, mood })
        ctx.reply('想吃什麼類型？（直接傳 "隨便" 跳過）')
        return
      }
    }

    if (session.awaitingFoodType) {
      const item = text === '隨便' ? undefined : text
      ctx.reply('稍等一下，幫你找美食中... 🔍')

      try {
        const excludeIds = session.excludeIds ?? []
        const result = await getRecommendation(
          session.mood!,
          item,
          excludeIds
        )

        if (!result.restaurant) {
          await clearSession(userId)
          ctx.reply(result.message, MOOD_KEYBOARD)
          return
        }

        await saveSession(userId, {
          lastRecommendedId: result.restaurant.id,
          lastMood: session.mood,
          excludeIds: [...excludeIds, result.restaurant.id],
        })

        let reply = result.message
        reply += `\n\n🍽 *${result.restaurant.name}*`
        if (result.restaurant.mrt_station) reply += `\n📍 捷運 ${result.restaurant.mrt_station} 附近`
        if (result.restaurant.items.length) reply += `\n🏷 ${result.restaurant.items.join('、')}`
        if (result.restaurant.rating) reply += `\n⭐ ${result.restaurant.rating}/5`
        if (result.restaurant.review) reply += `\n💬 ${result.restaurant.review}`

        ctx.reply(reply, {
          parse_mode: 'Markdown',
          ...Markup.keyboard([['換一家', '好，就這家了']]).resize(),
        })
      } catch {
        await clearSession(userId)
        ctx.reply('推薦失敗，請稍後再試 😢', MOOD_KEYBOARD)
      }
      return
    }

    // Follow-up after recommendation
    if (session.lastRecommendedId) {
      if (text === '換一家') {
        ctx.reply('好，再找一家... 🔍')
        try {
          const result = await getRecommendation(
            session.lastMood!,
            undefined,
            session.excludeIds ?? []
          )

          if (!result.restaurant) {
            await clearSession(userId)
            ctx.reply('已經沒有其他選擇了 😅', MOOD_KEYBOARD)
            return
          }

          await saveSession(userId, {
            lastRecommendedId: result.restaurant.id,
            lastMood: session.lastMood,
            excludeIds: [...(session.excludeIds ?? []), result.restaurant.id],
          })

          let reply = result.message
          reply += `\n\n🍽 *${result.restaurant.name}*`
          if (result.restaurant.mrt_station) reply += `\n📍 捷運 ${result.restaurant.mrt_station} 附近`
          if (result.restaurant.items.length) reply += `\n🏷 ${result.restaurant.items.join('、')}`
          if (result.restaurant.rating) reply += `\n⭐ ${result.restaurant.rating}/5`
          if (result.restaurant.review) reply += `\n💬 ${result.restaurant.review}`

          ctx.reply(reply, {
            parse_mode: 'Markdown',
            ...Markup.keyboard([['換一家', '好，就這家了']]).resize(),
          })
        } catch {
          await clearSession(userId)
          ctx.reply('推薦失敗，請稍後再試 😢', MOOD_KEYBOARD)
        }
        return
      }

      if (['好', '好，就這家了', 'ok', 'OK', '沒問題', '好的'].includes(text)) {
        await clearSession(userId)
        ctx.reply('好吃！享用愉快 🍴', MOOD_KEYBOARD)
        return
      }

      ctx.reply('請選擇「換一家」或「好，就這家了」😊')
      return
    }

    if (session.awaitingRestaurantName) {
      await clearSession(userId)
      const db = createServiceClient()
      await db.from('restaurants').insert({ name: text, items: [], visited: false })
      ctx.reply(`✅ 已新增「${text}」！\n\n如需設定更多詳細資訊，請到網頁版編輯。`, MOOD_KEYBOARD)
      return
    }

    ctx.reply('我聽不太懂 😅 試試 /hungry 讓我推薦你美食！', MOOD_KEYBOARD)
  })

  return bot
}
