'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { EntityType } from '@/types'
import { ENTITY_CONFIG } from '@/lib/entity-config'

interface Props {
  entityType: EntityType
}

export function SectionNav({ entityType }: Props) {
  const pathname = usePathname()
  const config = ENTITY_CONFIG[entityType]

  const tabs = [
    { href: config.recommendPath, label: '推薦' },
    { href: config.listPath, label: '清單' },
    { href: config.newPath, label: '新增' },
  ]

  const isActive = (href: string): boolean => {
    if (href === config.listPath) {
      // List path is the section base — only active when exactly here or on edit pages
      return pathname === href || pathname.startsWith(`${href}/`) && !pathname.includes('/new') && !pathname.includes('/recommend')
    }
    return pathname === href
  }

  return (
    <nav
      aria-label={`${config.label}專區子導覽`}
      className="flex items-center gap-1.5 rounded-full bg-card/70 border border-border/70 p-1
                 shadow-[0_1px_2px_oklch(0.30_0.04_50_/_0.05)]"
    >
      {tabs.map(({ href, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex-1 inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              active
                ? 'bg-brand text-brand-foreground shadow-[0_1px_0_-1px_oklch(0.40_0.140_45)]'
                : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
