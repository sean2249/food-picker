'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ADMIN_HEADER,
  isUnlocked,
  logout,
  registerAdminDialog,
  storeSecret,
} from '@/lib/admin-client'

type Mode = 'enter' | 'manage'
type Resolver = (secret: string | null) => void

export function AdminUnlockDialog() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('enter')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const resolverRef = useRef<Resolver | null>(null)

  useEffect(() => {
    registerAdminDialog(resolver => {
      resolverRef.current = resolver
      setValue('')
      setError(null)
      setVerifying(false)
      // Management mode only when opened proactively (no pending action) while
      // already unlocked — otherwise we need the secret.
      setMode(!resolver && isUnlocked() ? 'manage' : 'enter')
      setOpen(true)
    })
    return () => registerAdminDialog(null)
  }, [])

  const resolve = (secret: string | null) => {
    resolverRef.current?.(secret)
    resolverRef.current = null
  }

  const close = () => {
    resolve(null)
    setOpen(false)
  }

  // base-ui fires onOpenChange(false) on Esc / overlay / close button.
  const handleOpenChange = (next: boolean) => {
    if (!next) close()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const secret = value.trim()
    if (!secret || verifying) return
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { [ADMIN_HEADER]: secret },
      })
      if (res.ok) {
        storeSecret(secret)
        resolve(secret)
        setOpen(false)
        return
      }
      setError(
        res.status === 401
          ? '密鑰不對，再試一次？'
          : '伺服器尚未設定管理密鑰，請稍後再試。'
      )
    } catch {
      setError('連線不太順，請再試一次。')
    } finally {
      setVerifying(false)
    }
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {mode === 'enter' ? (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>解鎖管理</DialogTitle>
              <DialogDescription>
                輸入管理密鑰，才能新增、修改或刪除口袋名單。輸入一次，這台裝置就會記住。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="admin-secret">管理密鑰</Label>
              <Input
                id="admin-secret"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={value}
                onChange={e => {
                  setValue(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="••••••••"
                className="h-10 rounded-xl text-base"
                aria-invalid={error ? true : undefined}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                取消
              </Button>
              <Button type="submit" disabled={verifying || !value.trim()}>
                {verifying ? '確認中…' : '解鎖'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4">
            <DialogHeader>
              <DialogTitle>管理模式已解鎖</DialogTitle>
              <DialogDescription>
                你現在可以新增、修改或刪除口袋名單。登出會清除這台裝置記住的密鑰。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                關閉
              </Button>
              <Button type="button" variant="destructive" onClick={handleLogout}>
                登出
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
