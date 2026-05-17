import { EntityEditPanel } from '@/components/EntityEditPanel'

export default function EditCafePage({ params }: { params: Promise<{ id: string }> }) {
  return <EntityEditPanel entityType="cafe" params={params} />
}
