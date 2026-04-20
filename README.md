# 美食選擇器

根據你的心情與天氣，透過 AI 推薦最適合的餐廳。

## 功能

- 心情輸入 → Claude AI 推薦餐廳
- 餐廳清單管理（新增、編輯、刪除）
- Telegram Bot 支援（`/hungry` 指令）
- 推薦紀錄歷史

## 技術架構

- **Frontend / Backend**: Next.js 16 (App Router)
- **資料庫**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (claude-haiku-4-5)
- **Telegram Bot**: Telegraf + Webhook
- **部署**: Cloudflare Workers (via @opennextjs/cloudflare)

## 本地開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

### 環境變數

複製 `.env.local.example` 並填入值：

```bash
cp .env.local.example .env.local
```

| 變數 | 說明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token（從 @BotFather 取得） |
| `TELEGRAM_WEBHOOK_URL` | Telegram Webhook URL（`https://<your-domain>/api/telegram`） |

## Telegram Bot

啟動本地 Bot（長輪詢模式）：

```bash
npm run bot
```

部署後設定 Webhook：

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram"
```

## 部署到 Cloudflare Workers

```bash
# 一鍵 build + deploy
bash scripts/deploy.sh

# 或分開執行
npm run cf:build
npm run cf:deploy
```

> **注意**：Next.js 16 預設使用 Turbopack，但 @opennextjs/cloudflare 不支援 Turbopack 的 SSR chunk 格式。
> `package.json` 中的 `build` script 已加上 `--webpack` 繞過此問題。

上傳 Cloudflare Secrets：

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
# ... 其他變數
```
