import { CardGridSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <CardGridSkeleton crumbs={['Launchpad']} title="Launchpad" count={6} />;
}
