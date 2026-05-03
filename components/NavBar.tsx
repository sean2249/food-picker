'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

const navLinks = [
  { href: '/recommend', label: '推薦給我', accent: '✦', primary: true },
  { href: '/restaurants/new', label: '新增餐廳', accent: null, primary: false },
  { href: '/restaurants', label: '餐廳清單', accent: null, primary: false },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/restaurants') return pathname === '/restaurants'
  return pathname.startsWith(href)
}

export function NavBar() {
  const pathname = usePathname()
  const homeActive = pathname === '/'
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-30 border-b border-amber-200/70 bg-[--nav-bg]/95 backdrop-blur-sm
                 shadow-[0_1px_3px_0_oklch(0.580_0.165_48_/_0.07)]"
    >
      <nav className="px-4 py-2.5 flex items-center gap-3">
        <Link
          href="/"
          aria-label="美食選擇器 首頁"
          aria-current={homeActive ? 'page' : undefined}
          className="group flex items-center gap-2 rounded-lg px-1
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
        >
          <BrandMark />
          <span className="text-[15px] tracking-tight text-foreground group-hover:text-brand transition-colors">
            美食選擇器
          </span>
        </Link>

        {/* Inline nav — visible at sm+ where there's room for full link row */}
        <ul className="ml-auto hidden sm:flex items-center gap-3 sm:gap-4 text-sm">
          {navLinks.map(({ href, label, accent, primary }) => {
            const active = isActive(href, pathname)

            if (primary) {
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'px-3 py-2 rounded-full transition-colors',
                      'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1',
                      active
                        ? 'bg-brand text-brand-foreground shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]'
                        : 'bg-brand/15 text-brand hover:bg-brand/25',
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{label}</span>
                      {accent && <span aria-hidden>{accent}</span>}
                    </span>
                  </Link>
                </li>
              )
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'py-2 block transition-colors rounded-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1',
                    active
                      ? 'text-brand border-b-2 border-brand'
                      : 'text-foreground/75 hover:text-foreground',
                  ].join(' ')}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Hamburger — only at <sm */}
        <button
          type="button"
          aria-label={open ? '關閉選單' : '開啟選單'}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(o => !o)}
          className="ml-auto sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl
                     text-foreground hover:bg-brand/10 active:bg-brand/15
                     transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
        >
          <HamburgerIcon open={open} />
        </button>
      </nav>

      {/* Slide-down panel — mobile only. grid-template-rows 0fr → 1fr animates
          height without layout jank, per impeccable's motion guidance */}
      <div
        id={panelId}
        role="region"
        aria-label="主選單"
        aria-hidden={!open}
        className={[
          'sm:hidden grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <ul className="px-3 pb-3 pt-1 flex flex-col gap-1.5 border-t border-dashed border-border/70">
            {navLinks.map(({ href, label, accent, primary }, i) => {
              const active = isActive(href, pathname)
              return (
                <li
                  key={href}
                  className="opacity-0 -translate-y-1 transition-[opacity,transform] duration-300 ease-out"
                  style={{
                    transitionDelay: open ? `${80 + i * 50}ms` : '0ms',
                    ...(open ? { opacity: 1, transform: 'translateY(0)' } : {}),
                  }}
                >
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    tabIndex={open ? 0 : -1}
                    className={[
                      'flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-base',
                      'transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
                      primary
                        ? active
                          ? 'bg-brand text-brand-foreground shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)]'
                          : 'bg-brand/15 text-brand hover:bg-brand/25'
                        : active
                          ? 'bg-brand/10 text-brand'
                          : 'text-foreground/85 hover:bg-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden className={[
                        'h-1.5 w-1.5 rounded-full',
                        primary ? 'bg-current' : active ? 'bg-brand' : 'bg-foreground/30',
                      ].join(' ')} />
                      <span>{label}</span>
                    </span>
                    {accent && (
                      <span aria-hidden className="text-sm opacity-80">{accent}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </header>
  )
}

// — Brand mark: tiramisu mini (cocoa-cream-coffee stripes) in a soft rounded
//   square. No face at this size — the layered stripes carry the identity.
//   Doubles as home link. —
function BrandMark() {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px]
                 bg-brand/12 ring-1 ring-brand/25 group-hover:bg-brand/20 transition-colors"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <defs>
          <clipPath id="brand-tira">
            <rect x="3" y="5" width="18" height="14" rx="3" ry="3.5" />
          </clipPath>
        </defs>
        <g clipPath="url(#brand-tira)">
          <rect x="3" y="5"    width="18" height="3.4" fill="oklch(0.36 0.07 55)" />
          <rect x="3" y="8.4"  width="18" height="2.8" fill="oklch(0.93 0.035 80)" />
          <rect x="3" y="11.2" width="18" height="2.6" fill="oklch(0.60 0.085 55)" />
          <rect x="3" y="13.8" width="18" height="2.6" fill="oklch(0.93 0.035 80)" />
          <rect x="3" y="16.4" width="18" height="2.6" fill="oklch(0.60 0.085 55)" />
        </g>
        <rect x="3" y="5" width="18" height="14" rx="3" ry="3.5"
              fill="none" stroke="oklch(0.625 0.175 45)" strokeWidth="1.3" strokeLinejoin="round" />
        {/* Cocoa dust dots on top band */}
        <circle cx="7" cy="6.4" r="0.45" fill="oklch(0.18 0.04 50 / 0.7)" />
        <circle cx="11" cy="6.8" r="0.55" fill="oklch(0.18 0.04 50 / 0.7)" />
        <circle cx="16" cy="6.5" r="0.4" fill="oklch(0.18 0.04 50 / 0.7)" />
      </svg>
    </span>
  )
}

// — Hamburger that morphs into an X. Three brush-stroke bars. —
function HamburgerIcon({ open }: { open: boolean }) {
  const bar = 'absolute left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-current ' +
              'transition-[transform,opacity] duration-300 ease-[cubic-bezier(.4,.01,.2,1)]'
  return (
    <span aria-hidden className="relative inline-block h-5 w-5">
      <span
        className={bar}
        style={{
          top: '6px',
          transform: open
            ? 'translate(-50%, 4px) rotate(45deg)'
            : 'translate(-50%, 0)',
        }}
      />
      <span
        className={bar}
        style={{
          top: '10px',
          opacity: open ? 0 : 1,
          transform: open ? 'translate(-50%, 0) scaleX(0.4)' : 'translate(-50%, 0)',
        }}
      />
      <span
        className={bar}
        style={{
          top: '14px',
          transform: open
            ? 'translate(-50%, -4px) rotate(-45deg)'
            : 'translate(-50%, 0)',
        }}
      />
    </span>
  )
}
