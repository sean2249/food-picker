import { EntityEditPanel } from '@/components/EntityEditPanel'

export default function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  return <EntityEditPanel entityType="restaurant" params={params} />
}
