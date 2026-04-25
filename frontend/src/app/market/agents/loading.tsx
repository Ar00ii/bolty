import { CardGridSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <CardGridSkeleton crumbs={['Market', 'Agents']} title="Agents" count={9} />;
}
