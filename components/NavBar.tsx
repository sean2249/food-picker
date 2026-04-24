'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: '首頁', primary: false },
  { href: '/recommend', label: '推薦給我 ✦', primary: true },
  { href: '/restaurants/new', label: '新增餐廳', primary: false },
  { href: '/restaurants', label: '餐廳清單', primary: false },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/restaurants') return pathname === '/restaurants'
  return pathname.startsWith(href)
}

export function NavBar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-amber-200/60 bg-[--nav-bg] shadow-[0_1px_3px_0_oklch(0.580_0.165_48_/_0.07)]">
      <nav className="px-4 py-2 flex gap-4 items-center text-sm font-medium">
        {navLinks.map(({ href, label, primary }) => {
          const active = isActive(href, pathname)

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'px-3 py-2 rounded-full text-sm font-semibold transition-colors',
                  'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={[
                'py-2 block transition-colors rounded-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                active
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
