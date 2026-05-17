import { redirect } from 'next/navigation'

export default function LegacyRecommendPage() {
  redirect('/restaurants/recommend')
}
