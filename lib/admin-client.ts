'use client'

export const ADMIN_HEADER = 'x-admin-secret'
const STORAGE_KEY = 'food-picker:admin-secret'

export function getStoredSecret(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function storeSecret(secret: string): void {
  window.localStorage.setItem(STORAGE_KEY, secret)
}

export function clearStoredSecret(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

function askForSecret(): string | null {
  if (typeof window === 'undefined') return null
  const value = window.prompt('請輸入管理密鑰才能新增、修改或刪除資料')?.trim()
  return value || null
}

interface AdminFetchInit extends RequestInit {
  // Passive, high-frequency callers (address autocomplete) pass false so a
  // missing secret never interrupts typing with a dialog — they just send
  // whatever is stored and quietly get nothing back when it's absent or wrong.
  prompt?: boolean
}

export async function adminFetch(
  url: string,
  { prompt = true, ...init }: AdminFetchInit = {}
): Promise<Response> {
  let secret = getStoredSecret()
  let askedThisCall = false
  if (!secret && prompt) {
    secret = askForSecret()
    askedThisCall = true
    if (secret) storeSecret(secret)
  }

  const run = (token: string | null) => {
    const headers = new Headers(init.headers)
    if (token) headers.set(ADMIN_HEADER, token)
    return fetch(url, { ...init, headers })
  }

  let res = await run(secret)

  // Re-prompt only when a previously stored secret was rejected (stale) — if we
  // already asked during this call, don't pop a second dialog.
  if (res.status === 401 && prompt && !askedThisCall) {
    clearStoredSecret()
    const retry = askForSecret()
    if (retry) {
      storeSecret(retry)
      res = await run(retry)
    }
  }

  return res
}
