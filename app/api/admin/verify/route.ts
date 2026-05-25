import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// Lightweight check so the unlock dialog can validate a typed secret without
// firing a real mutating action. No side effects — just runs the same gate.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  return NextResponse.json({ ok: true })
}
