import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { NavBar } from '@/components/NavBar'

const huninn = localFont({
  src: '../public/fonts/jf-openhuninn-2.1.ttf',
  variable: '--font-zakka',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: '美食選擇器',
  description: '餓了別煩惱，交給命運這一碗',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={huninn.variable}>
      <body className="zakka-paper">
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
