# Food Picker — Todo Improvements Design

**日期：** 2026-04-20  
**範圍：** Items 5, 9, 13, 2 from docs/todo.md + 編輯取消功能

---

## A. 移除造訪日期 + 視覺強化 (Items 5, 13)

### 造訪日期移除
- `RestaurantForm`：移除 `visit_date` input 欄位（UI 隱藏，DB 欄位保留，PATCH 請求不送此欄位）
- 不需要新增 DB migration

### Visited Badge（RestaurantCard）
- `visited=true`：綠色 badge 顯示「✓ 已造訪」
- `visited=false`：灰色 badge 顯示「未造訪」
- Badge 放在餐廳名稱旁（card header 區域）

### AI 推薦 review 權重（lib/recommendation.ts）
- 在每筆餐廳的 prompt 描述中，將 `review` 移至最前面並標記為「評語」
- 其餘欄位（items、tags、proximity）維持不變，排在評語之後

---

## B. 推薦後篩選 (Item 9)

### UX 行為
- 推薦結果出現後，篩選面板**維持展開**（不自動收起）
- 使用者可在結果可見的狀態下調整篩選條件
- 篩選條件變動時**不**自動重跑，避免誤觸
- 結果區塊新增「重新推薦」按鈕，點擊後以當前篩選條件重新呼叫 AI

### 架構
- 維持 pre-filter 架構（先篩後推），不做 post-filter on batch
- 「重新推薦」按鈕複用現有的 `handleRecommend` 邏輯，無需新增 API

---

## C. Changelog 在主頁面 (Item 2)

### 資料來源
- 讀取 `docs/releases/` 目錄下的 `.md` 檔案
- 按檔名降序排列，取最新 **3** 筆

### 渲染方式
- `app/page.tsx` 改為 async Server Component
- 使用 Node.js `fs` 在 server side 讀取檔案（build time 讀取，Cloudflare Workers 相容性需確認）
- 使用 `gray-matter` 解析 frontmatter（若無 frontmatter 則直接用檔名萃取日期與版本）
- Markdown 轉 HTML：使用 `marked` 或簡單 regex 解析標題與段落，避免引入 MDX 增加 build 複雜度
- 呈現方式：原生 `<details>/<summary>` HTML 元素，預設展開最新一筆，其餘收合

### Cloudflare Workers 相容性
- Edge runtime 不支援 Node.js `fs`，不可在 runtime 讀取檔案
- **採用方案：** 在 `lib/releases.ts` 中以 `import` 靜態引入各 `.md` 檔案為字串（webpack `asset/source` 或 `raw-loader`），配合 `next.config.js` 加入 webpack rule
- Build time 嵌入內容，Cloudflare Workers 完全相容
- 新增 release 時只需在 `lib/releases.ts` 加一行 import，並確保只匯出最新 3 筆

---

## D. 編輯取消按鈕（新增功能）

### 實作
- `RestaurantForm` 新增 `onCancel?: () => void` prop
- Edit page（`app/restaurants/[id]/edit/page.tsx`）傳入 `() => router.back()` 作為 `onCancel`
- 取消按鈕樣式：`variant="outline"`，放在儲存按鈕旁
- New page（`app/restaurants/new/page.tsx`）可選擇性傳入 onCancel（導回 `/restaurants`）

---

## 受影響的檔案

| 檔案 | 異動 |
|------|------|
| `app/page.tsx` | 改為 async Server Component，新增 changelog section |
| `app/restaurants/[id]/edit/page.tsx` | 傳入 onCancel prop |
| `app/restaurants/new/page.tsx` | 選擇性傳入 onCancel prop |
| `app/recommend/page.tsx` | 篩選面板維持展開；新增「重新推薦」按鈕 |
| `components/RestaurantForm.tsx` | 移除 visit_date 欄位；新增 onCancel prop |
| `components/RestaurantCard.tsx` | 新增 visited badge |
| `lib/recommendation.ts` | review 移至 prompt 描述最前面 |
