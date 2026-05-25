import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_HEADER = 'x-admin-secret'

// Gate for write / cost-incurring routes. Reads and the recommendation flow
// stay open so friends never hit a login wall. Fails closed: when ADMIN_SECRET
// is unset every guarded route refuses, rather than silently allowing writes.
export function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: '伺服器尚未設定管理密鑰' }, { status: 503 })
  }
  if (req.headers.get(ADMIN_HEADER) !== secret) {
    return NextResponse.json({ error: '需要管理密鑰' }, { status: 401 })
  }
  return null
}
