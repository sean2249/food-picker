import { createBot } from '../lib/telegram-bot'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set')

const bot = createBot(token)
bot.launch()
console.log('Telegram bot is running (long-poll mode)')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
