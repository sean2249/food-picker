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
        <svg
          aria-hidden="true"
          className="fixed inset-0 w-full h-full pointer-events-none -z-10 opacity-10"
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="#C4650A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* noodle bowl */}
          <ellipse cx="80" cy="80" rx="30" ry="18" />
          <path d="M50 80 Q55 100 80 104 Q105 100 110 80" />
          <path d="M62 74 Q70 58 76 74 Q83 58 90 74" />
          {/* chopsticks */}
          <line x1="125" y1="30" x2="148" y2="95" />
          <line x1="135" y1="30" x2="156" y2="90" />
          {/* leaf / herb */}
          <path d="M420 40 Q435 18 460 26 Q448 52 420 40Z" />
          <line x1="420" y1="40" x2="440" y2="26" />
          {/* dumpling */}
          <path d="M650 60 Q665 38 688 44 Q697 62 688 82 Q665 88 650 60Z" />
          <path d="M655 62 Q662 54 670 58" />
          <path d="M665 44 Q673 42 681 48" />
          {/* fork */}
          <line x1="740" y1="380" x2="750" y2="440" />
          <line x1="736" y1="380" x2="736" y2="400" />
          <line x1="742" y1="380" x2="742" y2="400" />
          <line x1="748" y1="380" x2="748" y2="400" />
          {/* sparkle */}
          <line x1="380" y1="300" x2="380" y2="322" />
          <line x1="369" y1="311" x2="391" y2="311" />
          <line x1="372" y1="303" x2="388" y2="319" />
          <line x1="388" y1="303" x2="372" y2="319" />
          {/* herb bottom-left */}
          <path d="M120 500 Q138 476 158 484 Q144 508 120 500Z" />
          <line x1="120" y1="500" x2="140" y2="482" />
          {/* noodle wave */}
          <path d="M530 530 Q548 518 566 530 Q584 542 602 530 Q620 518 638 530" />
          {/* small bowl */}
          <ellipse cx="310" cy="555" rx="22" ry="13" />
          <path d="M288 555 Q292 572 310 574 Q328 572 332 555" />
        </svg>
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
