# 決策紀錄：Admin 狀態可見性 + Autocomplete 錯誤提示

> 2026-05-27 · 對應 design：`2026-05-27-admin-state-and-autocomplete-errors-design.md`

---

## D1. autocomplete 失敗用「inline 狀態訊息」而非彈 modal

- **背景**：`AddressAutocomplete.tsx:74,78` 把 401/500/網路錯全吞成空陣列，使用者打字後畫面全空、不知為何（trace：本次 session 的 `/api/places/autocomplete` 500/401 排查，最終卡在「不知道要解鎖」）。
- **替代方案**：
  - (a) inline 狀態訊息（輸入框下方）— 不打斷打字。
  - (b) 401 時直接彈解鎖 dialog — 最不會被忽略，但打字打到一半被中斷，違反既有 `prompt:false` 設計。
  - (c) 只在 console log — 對終端使用者等於沒提示。
- **選擇**：(a)。保留 `prompt:false` 的「不打斷」原則，同時把沉默改成可見提示。
- **影響**：`AddressAutocomplete` 新增 `searchError` 列舉狀態，渲染移到既有保留高度區；503 不再 early-return 蓋掉輸入框（改為輸入框恆在 + 下方訊息）。
- **驗證**：dev server 未解鎖時打字 → 出現「需先解鎖」列；製造 500 → 出現「搜尋失敗」列。

## D2. 401 附一鍵 [解鎖]，且解鎖後自動重搜

- **背景**：光顯示「需要解鎖」仍要使用者自己找 nav 鎖頭、解鎖、再回來重打字才會觸發搜尋 — 仍接近「用猜的」。
- **替代方案**：
  - (a) 訊息 + [解鎖] 按鈕 + 解鎖後自動重搜。
  - (b) 只給訊息、不給按鈕（使用者自己去 nav 解鎖）。
  - (c) 給按鈕但不自動重搜（解鎖後要再按一字）。
- **選擇**：(a)。直接消除「解鎖完還要多一步」的斷點。
- **影響**：`AddressAutocomplete` 透過 `subscribeAuth` 監聽解鎖、bump nonce 併入 effect deps 觸發重搜；新增對 `openAdminDialog` 的呼叫。
- **驗證**：未解鎖打「鼎泰豐」→ 點 [解鎖] → 輸入密鑰 → 不再打字、建議自動出現。

## D3. 鎖頭狀態改「文字膠囊 pill」，文案用「唯讀 / 編輯中」

- **背景**：`AdminNavLock` 桌機僅 icon 換色，區別太弱；「登入管理」字樣語意像一般登入、不傳達「目前是讀還是寫」。user 明確要求一眼可辨且拿掉「登入管理」。
- **替代方案**：
  - (a) 文字膠囊 pill（🔒 唯讀 灰框 / 🔓 編輯中 橘底）。
  - (b) icon + 狀態小圓點（灰↔橘）— 文字最少但仍偏微弱。
  - (c) 開關式 toggle「編輯模式 開/關」— 語意清楚但體積大，手機 nav 吃緊。
- **選擇**：(a)。填色 + 文字雙重差異最明顯，且橘色填滿呼應品牌 warm 主 CTA 調性。
- **影響**：`AdminNavLock` 兩個 variant 都改 pill；移除舊文案；新增 state-aware `aria-label`。`NavBar` 呼叫端不變（`variant`/`tabIndex`/`onAction` 介面保留）。
- **驗證**：Playwright 截圖鎖定/解鎖兩態，確認填色與文字差異明顯。

## D4. 用列舉狀態取代 `notConfigured` boolean

- **背景**：現有只有一個布林 `notConfigured`，無法表達 401 / failed 等其他失敗。
- **替代方案**：(a) 單一 `searchError` 列舉；(b) 多個布林（notConfigured / unauthorized / failed）。
- **選擇**：(a) 列舉 — 狀態互斥，單一來源避免布林組合爆炸。
- **影響**：移除 `notConfigured` state；渲染分支改讀 `searchError`。
- **驗證**：`npx tsc --noEmit` 通過（列舉窮舉）。

---

### 待 user 確認
- **D2 的「自動重搜」是本次新增的 scope**（原始要求只提到「要顯示錯誤」+「按鈕」）。我判斷不自動重搜會留下斷點，故納入；若你想先只做訊息+按鈕、不要自動重搜，講一聲即可拆掉。
