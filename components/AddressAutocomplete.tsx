'use client'
import { useEffect, useRef, useState } from 'react'
import { LockIcon } from 'lucide-react'
import type { PlaceDetail, PlaceSuggestion } from '@/lib/places'
import { adminFetch, openAdminDialog, subscribeAuth } from '@/lib/admin-client'

interface LinkedPlace {
  name: string
  address: string | null
}

interface Props {
  // Currently linked Google place (drives the chip). null → show search UI.
  value: LinkedPlace | null
  onSelect: (detail: PlaceDetail) => void
  onClear: () => void
  initialQuery?: string   // backfill: pre-seed the search with the existing name
  placeholder?: string
}

// Why the search produced no dropdown. null = success / idle. Surfaced inline
// below the input so a silent failure never leaves the user guessing.
type SearchError = 'unauth' | 'unconfigured' | 'failed' | null

const inputClass =
  'w-full rounded-2xl border border-border/80 bg-card/80 ' +
  'px-4 py-3 text-base text-foreground ' +
  'placeholder:text-foreground/40 ' +
  'focus:outline-none focus:border-brand/60 focus:bg-card ' +
  'transition-colors'

export function AddressAutocomplete({
  value,
  onSelect,
  onClear,
  initialQuery,
  placeholder = '搜尋店名或地點',
}: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [searchError, setSearchError] = useState<SearchError>(null)
  // Bumped whenever the admin lock state flips, so the debounce effect re-runs
  // and re-searches the current query right after the user unlocks.
  const [authNonce, setAuthNonce] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Guards against out-of-order autocomplete responses overwriting newer ones.
  const reqSeq = useRef(0)

  // Re-run search when admin unlock state changes (login/logout).
  useEffect(() => subscribeAuth(() => setAuthNonce(n => n + 1)), [])

  // Debounced autocomplete on query change. All state updates live inside the
  // timer callback (not the synchronous effect body) so they don't cascade.
  useEffect(() => {
    const trimmed = query.trim()
    const seq = ++reqSeq.current
    const timer = setTimeout(async () => {
      if (!trimmed) {
        setSuggestions([])
        setSearchError(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await adminFetch('/api/places/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmed }),
          prompt: false,
        })
        if (seq !== reqSeq.current) return
        if (res.status === 401) {
          setSearchError('unauth')
          setSuggestions([])
          return
        }
        if (res.status === 503) {
          setSearchError('unconfigured')
          setSuggestions([])
          return
        }
        if (!res.ok) {
          setSearchError('failed')
          setSuggestions([])
          return
        }
        const data = await res.json().catch(() => ({}))
        if (seq !== reqSeq.current) return
        setSearchError(null)
        setSuggestions(data.suggestions ?? [])
        setOpen(true)
      } catch {
        if (seq === reqSeq.current) setSearchError('failed')
      } finally {
        if (seq === reqSeq.current) setLoading(false)
      }
    }, trimmed ? 250 : 0)
    return () => clearTimeout(timer)
  }, [query, authNonce])

  // Close dropdown when tapping outside (mobile + desktop).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const handlePick = async (s: PlaceSuggestion) => {
    setOpen(false)
    setSuggestions([])
    setQuery('')
    setResolving(true)
    try {
      const res = await adminFetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: s.placeId }),
        prompt: false,
      })
      if (res.ok) {
        const detail: PlaceDetail = await res.json()
        onSelect(detail)
      }
    } catch {
      // swallow — user can retry; nothing destructive happened
    } finally {
      setResolving(false)
    }
  }

  const runBackfill = () => {
    if (!initialQuery) return
    setQuery(initialQuery)
    // iOS Safari sometimes won't scroll focus into view on its own.
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  // Linked state — show chip instead of the search field.
  if (value) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <span
          className="inline-flex max-w-full flex-col gap-0.5 rounded-2xl border border-brand/30
                     bg-brand/12 px-3 py-2 text-sm text-brand"
        >
          <span className="inline-flex items-center gap-1.5 break-words">
            <PinGlyph />
            <span className="break-words">{value.name || '已連結地點'}</span>
          </span>
          {value.address && (
            <span className="text-xs text-brand/75 break-words">{value.address}</span>
          )}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center rounded-full border border-border/70 bg-card/60
                     px-3 py-1.5 text-xs text-foreground/70
                     hover:bg-card hover:text-foreground transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          清除連結
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length) setOpen(true)
          inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }}
        placeholder={placeholder}
        disabled={resolving}
        className={`${inputClass} disabled:opacity-60`}
        autoComplete="off"
      />

      {/* Reserve height so the layout below doesn't jump as states change. */}
      <div className="min-h-[1.25rem] pt-1">
        {resolving ? (
          <span className="text-xs text-foreground/55">讀取地點資訊…</span>
        ) : loading ? (
          <span className="text-xs text-foreground/55">搜尋中…</span>
        ) : searchError === 'unauth' ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <LockIcon size={12} aria-hidden />
              需先解鎖管理才能搜尋地址
            </span>
            <button
              type="button"
              onClick={() => openAdminDialog()}
              className="rounded-full border border-brand/50 bg-brand/10 px-2.5 py-0.5 font-medium text-brand
                         hover:bg-brand/20 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              解鎖
            </button>
          </span>
        ) : searchError === 'unconfigured' ? (
          <span className="text-xs text-foreground/55">Google Maps 搜尋未啟用（缺少 API key）。</span>
        ) : searchError === 'failed' ? (
          <span className="text-xs text-foreground/60">⚠ 地址搜尋失敗，請稍後再試。</span>
        ) : initialQuery && !query ? (
          <button
            type="button"
            onClick={runBackfill}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand/40
                       bg-brand/5 px-3 py-1 text-xs text-brand
                       hover:bg-brand/10 hover:border-brand/60 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <PinGlyph />
            用「{initialQuery}」搜尋 Google
          </button>
        ) : null}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[50vh] overflow-y-auto
                     rounded-2xl border border-border/80 bg-card shadow-lg"
          role="listbox"
        >
          {suggestions.map(s => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left
                           hover:bg-muted/60 transition-colors
                           focus-visible:outline-none focus-visible:bg-muted/60"
              >
                <span className="text-sm text-foreground break-words">{s.name}</span>
                {s.address && (
                  <span className="text-xs text-foreground/60 break-words">{s.address}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PinGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  )
}
