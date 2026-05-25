'use client'

export const ADMIN_HEADER = 'x-admin-secret'
const STORAGE_KEY = 'food-picker:admin-secret'

export function getStoredSecret(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function storeSecret(secret: string): void {
  window.localStorage.setItem(STORAGE_KEY, secret)
  notifyAuth()
}

export function clearStoredSecret(): void {
  window.localStorage.removeItem(STORAGE_KEY)
  notifyAuth()
}

export function isUnlocked(): boolean {
  return getStoredSecret() !== null
}

export function logout(): void {
  clearStoredSecret()
}

// — Reactive unlock state, so the nav lock indicator can re-render on
//   login/logout without a Context (none exists in this codebase). —
type AuthListener = () => void
const authListeners = new Set<AuthListener>()

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

function notifyAuth(): void {
  authListeners.forEach(listener => listener())
}

// — Bridge between the plain `adminFetch` function and the React unlock
//   dialog. The dialog registers an opener on mount; `requestSecret` hands it
//   a resolver and awaits the verified secret. Falls back to window.prompt if
//   the dialog isn't mounted (defensive). —
type SecretResolver = (secret: string | null) => void
type DialogOpener = (resolver: SecretResolver | null) => void

let dialogOpener: DialogOpener | null = null

export function registerAdminDialog(opener: DialogOpener | null): void {
  dialogOpener = opener
}

function requestSecret(): Promise<string | null> {
  if (!dialogOpener) {
    if (typeof window === 'undefined') return Promise.resolve(null)
    const value = window.prompt('請輸入管理密鑰才能新增、修改或刪除資料')?.trim() || null
    if (value) storeSecret(value)
    return Promise.resolve(value)
  }
  return new Promise(resolve => dialogOpener!(resolve))
}

// Opens the dialog for proactive management (nav lock): no pending action to
// resolve — locked → ask for secret, unlocked → offer logout.
export function openAdminDialog(): void {
  dialogOpener?.(null)
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
    secret = await requestSecret()
    askedThisCall = true
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
    const retry = await requestSecret()
    if (retry) res = await run(retry)
  }

  return res
}
