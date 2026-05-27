# Admin 狀態可見性 + Autocomplete 錯誤提示

> 2026-05-27 · 範圍：`components/AddressAutocomplete.tsx`、`components/AdminNavLock.tsx`

## 背景 / 問題

兩個 UX 缺口，都讓使用者「要用猜的」：

1. **autocomplete 靜默失敗** — `AddressAutocomplete` 只有 503（沒設 key）會顯示訊息；401（未解鎖）、500（Google 錯）、網路錯全部走進 `setSuggestions([])`（`AddressAutocomplete.tsx:74,78`），畫面一片空白、零提示。最常見的 401 情境（curator 沒先解鎖）完全沒有線索。
2. **鎖頭狀態不明顯** — `AdminNavLock` 桌機版只靠 icon 換色（灰↔橘）區分鎖定/解鎖；手機版用「登入管理／登出管理」文字，狀態靠很淡的線索，且字樣不直觀。

## 目標

1. autocomplete 失敗時以 **inline、非阻斷** 的訊息說明原因；401 附一鍵 `[解鎖]`，**解鎖後自動用當前 query 重搜**。
2. nav 鎖頭狀態 **一眼可辨**：文字膠囊 pill，`🔒 唯讀`（淡）vs `🔓 編輯中`（橘底填滿），拿掉「登入管理」字樣。

## 非目標（不動）

admin 驗證機制、`/api/places/*`、Google API 設定、`adminFetch` 既有重試邏輯、`prompt:false` 不打斷打字的原則。

## 設計

### 元件 1：`AddressAutocomplete`

- 以列舉狀態 `searchError: 'unauth' | 'unconfigured' | 'failed' | null` 取代現有的 `notConfigured` boolean。
- debounce effect 內的對應（全部仍包在 `seq === reqSeq.current` 競態保護中）：

  | 情況 | searchError |
  |---|---|
  | 200 | `null`（顯示建議） |
  | 401 | `unauth` |
  | 503 | `unconfigured` |
  | 其他 `!res.ok`（含 500） | `failed` |
  | `catch`（網路） | `failed` |
  | query 清空 | `null` |

- **呈現位置**：輸入框下方既有的「保留高度」狀態區（`AddressAutocomplete.tsx:185-204`），**輸入框保持可見**（不再像現在 503 那樣整個 early-return 蓋掉輸入框）。
  - `unauth`：`🔒 需先解鎖管理才能搜尋地址` ＋ `[解鎖]` 按鈕 → `openAdminDialog()`。
  - `unconfigured`：沿用現有文案「Google Maps 搜尋未啟用」。
  - `failed`：`⚠ 地址搜尋失敗，請稍後再試`。
- **解鎖後自動重搜**：元件以 `subscribeAuth`（`admin-client.ts:34`）監聽解鎖狀態翻轉，翻轉時 bump 一個 nonce state，將該 nonce 併入 debounce effect 的依賴陣列 → 自動以當前 query 重打。query 仍在輸入框，使用者免操作。
- **保留**：`prompt:false`、`reqSeq` 防競態、point-outside 關閉下拉、chip / backfill 行為。

### 元件 2：`AdminNavLock`

- 兩個 variant（桌機 `icon`、手機 `row`）都改渲染文字膠囊 pill，沿用 lucide `LockIcon` / `LockOpenIcon`。
  - **鎖定**：`🔒 唯讀` — `border-border text-foreground/60`、透明底。
  - **解鎖**：`🔓 編輯中` — `bg-brand text-brand-foreground` 橘色填滿白字。
- 移除「登入管理／登出管理／已解鎖」字樣。
- a11y：`aria-label` 描述狀態＋動作（鎖定「目前唯讀，點此解鎖管理」／解鎖「編輯模式已開啟，點此鎖定」）。
- 點擊行為不變（`openAdminDialog()`）。`variant` 仍保留，差別僅在容器尺寸（桌機 compact、手機 menu 內較大 tap target）。

## 驗證

無測試框架 → 閘門為 `npx tsc --noEmit` + `npm run lint`。再用 dev server 實測四種狀態（解鎖前/後 autocomplete、pill 鎖定/解鎖外觀），並以 Playwright 截圖確認 pill 兩態。
