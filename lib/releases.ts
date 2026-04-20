import r1 from '../docs/releases/2026-04-20-v1.0.0.md'

interface Release {
  filename: string
  content: string
}

const all: Release[] = [
  { filename: '2026-04-20-v1.0.0.md', content: r1 },
]

export const releases = all
  .sort((a, b) => b.filename.localeCompare(a.filename))
  .slice(0, 3)

export function parseReleaseTitle(content: string): string {
  return content.match(/^# (.+)$/m)?.[1] ?? '更新記錄'
}

export function parseReleaseDate(content: string): string {
  return content.match(/\*\*發布日期：\*\* (.+)/)?.[1]?.trim() ?? ''
}

export function parseReleaseSections(content: string): string[] {
  return content.match(/^### .+$/gm)?.map(s => s.replace(/^### /, '')) ?? []
}
