'use client'

import { useSyncExternalStore } from 'react'
import { LockIcon, LockOpenIcon } from 'lucide-react'
import { isUnlocked, openAdminDialog, subscribeAuth } from '@/lib/admin-client'

interface Props {
  variant?: 'icon' | 'row'
  // Mobile menu passes its open state so the pill isn't tab-focusable while the
  // panel is collapsed, and a callback to close the menu after opening.
  tabIndex?: number
  onAction?: () => void
}

function useUnlocked(): boolean {
  return useSyncExternalStore(subscribeAuth, isUnlocked, () => false)
}

export function AdminNavLock({ variant = 'icon', tabIndex, onAction }: Props) {
  const unlocked = useUnlocked()
  const handleClick = () => {
    openAdminDialog()
    onAction?.()
  }

  const Icon = unlocked ? LockOpenIcon : LockIcon
  const label = unlocked ? '編輯中' : '唯讀'
  const aria = unlocked ? '編輯模式已開啟，點此鎖定' : '目前唯讀，點此解鎖管理'

  // Filled brand pill when unlocked vs. muted outline when locked — the fill +
  // label give an at-a-glance read/write distinction.
  const pillClass = (size: string) =>
    [
      'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1',
      size,
      unlocked
        ? 'bg-brand text-brand-foreground shadow-[0_2px_0_-1px_oklch(0.40_0.140_45)] hover:bg-brand/90'
        : 'border border-border text-foreground/60 hover:border-brand/40 hover:text-foreground/80',
    ].join(' ')

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={handleClick}
        tabIndex={tabIndex}
        aria-label={aria}
        className={pillClass('px-4 py-2.5 text-base')}
      >
        <Icon size={18} aria-hidden />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={aria}
      title={aria}
      className={pillClass('px-3 py-1.5 text-sm')}
    >
      <Icon size={15} aria-hidden />
      <span>{label}</span>
    </button>
  )
}
