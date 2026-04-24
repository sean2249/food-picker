'use client'

import Link from 'next/link'

export function NavBar() {
  return (
    <header className="border-b border-border">
      <nav className="px-4 py-3 flex gap-6 text-sm font-medium">
        <Link href="/" className="hover:text-primary">首頁</Link>
        <Link href="/recommend" className="hover:text-primary">推薦給我</Link>
        <Link href="/restaurants/new" className="hover:text-primary">新增餐廳</Link>
        <Link href="/restaurants" className="hover:text-primary">餐廳清單</Link>
      </nav>
    </header>
  )
}
