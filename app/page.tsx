import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { releases, parseReleaseTitle, parseReleaseDate, parseReleaseSections } from '@/lib/releases'

export default function Home() {
  return (
    <div className="space-y-8 pt-12">
      <div className="text-center space-y-5">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-sm">
          <span aria-hidden="true" className="text-2xl leading-none">🍜</span>
        </div>
        <h1 className="text-3xl font-black">美食選擇器</h1>
        <p className="text-sm font-semibold text-muted-foreground">餓了別煩惱，交給命運這一碗</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link href="/recommend">
            <Button size="lg" className="w-full bg-brand text-brand-foreground hover:bg-brand/90 font-bold">🍽️ 我餓了！推薦我</Button>
            </Link>
          <Link href="/restaurants/new">
            <Button variant="outline" className="w-full" >📥 新增餐廳</Button>
          </Link>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-semibold border-b bg-muted/30">更新記錄</h2>
        {releases.map((release, i) => (
          <details key={release.filename} open={i === 0} className="border-b last:border-0">
            <summary className="px-4 py-3 text-sm cursor-pointer hover:bg-muted list-none flex items-center justify-between">
              <span className="font-medium">{parseReleaseTitle(release.content)}</span>
              {parseReleaseDate(release.content) && (
                <span className="text-muted-foreground text-xs">{parseReleaseDate(release.content)}</span>
              )}
            </summary>
            <ul className="px-6 pb-3 pt-1 space-y-1">
              {parseReleaseSections(release.content).map(section => (
                <li key={section} className="text-sm text-muted-foreground">{section}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
