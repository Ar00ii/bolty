import { CardGridSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <CardGridSkeleton crumbs={['Market', 'Repos']} title="Repos" count={9} />;
}
