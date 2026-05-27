'use client'

import { useSyncExternalStore } from 'react'
import { LockIcon, LockOpenIcon } from 'lucide-react'
import { isUnlocked, openAdminDialog, subscribeAuth } from '@/lib/admin-client'

interface Props {
  variant?: 'icon' | 'row'
  // Mobile menu passes its open state so the row isn't tab-focusable while the
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

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={handleClick}
        tabIndex={tabIndex}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-base
                   text-foreground/85 transition-colors hover:bg-muted hover:text-foreground
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <span className="inline-flex items-center gap-2">
          {unlocked
            ? <LockOpenIcon size={18} className="text-brand" />
            : <LockIcon size={18} className="text-foreground/50" />}
          <span>{unlocked ? '登出管理' : '登入管理'}</span>
        </span>
        {unlocked && <span className="text-sm text-brand/80">已解鎖</span>}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={unlocked ? '管理已解鎖，點此登出' : '登入管理'}
      title={unlocked ? '管理已解鎖' : '登入管理'}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1',
        unlocked
          ? 'text-brand hover:bg-brand/12'
          : 'text-foreground/55 hover:bg-brand/10 hover:text-foreground',
      ].join(' ')}
    >
      {unlocked ? <LockOpenIcon size={18} /> : <LockIcon size={18} />}
    </button>
  )
}
