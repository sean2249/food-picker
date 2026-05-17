# Food Picker / 美食選擇器

> Personal food-recommendation web app for Taipei. Stores your favorite
> restaurants and cafés, then asks Claude (Haiku) to recommend up to 3
> based on MRT station and tags. Made for friends; deployed on
> Cloudflare Workers.

Live: <https://food-picker.sean22492249.workers.dev>

---

## 這是什麼

> 餓了別煩惱，交給命運這一碗。

一個給朋友圈用的個人美食推薦 App。把吃過、想吃的餐廳和咖啡廳記下來，
站在某個捷運站前不知道要吃什麼的時候，按一下，讓 Claude 從你自己的口袋
名單裡挑最多 3 間給你。選了哪一間也會被記錄下來。

行動裝置優先設計，主要使用情境是「人站在外面、肚子餓、單手操作」。

## 功能

- 餐廳 / 咖啡廳清單管理（新增、編輯、刪除、評分、心得）
- 依捷運站 + AI 標籤推薦最多 3 間（Claude Haiku）
- 從心得自動產生標籤（`POST /api/restaurants/generate-tags`）
- 紀錄每次推薦清單與最後選了哪一間（`recommendation_logs`）

## 技術架構

- **Frontend / Backend**：Next.js 16.2.4（App Router、React 19）
- **資料庫**：Supabase（PostgreSQL）
- **AI**：Anthropic Claude Haiku（`@anthropic-ai/sdk`）
- **UI**：Tailwind CSS v4 + shadcn/ui
- **部署**：Cloudflare Workers（透過 `@opennextjs/cloudflare`）

> ⚠️ Build script 必須保留 `--webpack` 旗標。Next.js 16 預設使用
> Turbopack，但 `@opennextjs/cloudflare` 不支援其 SSR chunk 格式。

## 本地開發

```bash
npm install
npm run dev
```

開啟 <http://localhost:3000>。

### 環境變數

複製 `.env.local.example` 並填入值：

```bash
cp .env.local.example .env.local
```

| 變數 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL（client + server） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（client，唯讀） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（**僅 API routes**） |
| `ANTHROPIC_API_KEY` | Anthropic API key（**僅 API routes**） |

`SUPABASE_SERVICE_ROLE_KEY` 與 `ANTHROPIC_API_KEY` 絕不能暴露到 client。

## 部署到 Cloudflare Workers

```bash
# 一鍵 build + deploy
bash scripts/deploy.sh

# 或分開執行
npm run cf:build
npm run cf:deploy
```

上傳 Secrets 到 Worker：

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put ANTHROPIC_API_KEY
# NEXT_PUBLIC_* 變數寫在 wrangler.toml 即可
```

## License

MIT — 見 [`LICENSE`](./LICENSE)。
