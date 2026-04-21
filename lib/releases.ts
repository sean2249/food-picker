import { generatedReleases } from './releases.generated'

interface Release {
  filename: string
  content: string
}

const all: Release[] = generatedReleases

export const RELEASE_LIMIT = 3

export const releases = all
  .sort((a, b) => b.filename.localeCompare(a.filename))
  .slice(0, RELEASE_LIMIT)

export function parseReleaseTitle(content: string): string {
  return content.match(/^# (.+)$/m)?.[1] ?? '更新記錄'
}

export function parseReleaseDate(content: string): string {
  return content.match(/\*\*發布日期：\*\* (.+)/)?.[1]?.trim() ?? ''
}

export function parseReleaseSections(content: string): string[] {
  return content.match(/^### .+$/gm)?.map(s => s.replace(/^### /, '')) ?? []
}
