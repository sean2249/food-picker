import type { Metadata } from 'next'
import { Noto_Serif_TC } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '美食選擇器',
  description: '心情天氣美食推薦',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={notoSerifTC.variable}>
      <body>
        <nav className="border-b px-4 py-3 flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary">首頁</Link>
          <Link href="/recommend" className="hover:text-primary">推薦給我</Link>
          <Link href="/restaurants/new" className="hover:text-primary">新增餐廳</Link>
          <Link href="/restaurants" className="hover:text-primary">餐廳清單</Link>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
