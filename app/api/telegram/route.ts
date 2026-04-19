import { NextRequest, NextResponse } from 'next/server'
import { createBot } from '@/lib/telegram-bot'

const token = process.env.TELEGRAM_BOT_TOKEN!
let bot: ReturnType<typeof createBot> | null = null

function getBot() {
  if (!bot) bot = createBot(token)
  return bot
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await getBot().handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
