import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="text-center space-y-6 pt-12">
      <h1 className="text-4xl font-bold">美食選擇器</h1>
      <p className="text-muted-foreground">根據你的心情與天氣，找到最適合的美食</p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Link href="/recommend">
          <Button size="lg" className="w-full">我餓了！推薦我</Button>
        </Link>
        <Link href="/restaurants/new">
          <Button variant="outline" className="w-full">新增餐廳</Button>
        </Link>
        <Link href="/restaurants">
          <Button variant="ghost" className="w-full">查看所有餐廳</Button>
        </Link>
      </div>
    </div>
  )
}
