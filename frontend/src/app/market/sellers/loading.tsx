import { ListSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <ListSkeleton crumbs={['Market', 'Sellers']} title="Top sellers" count={10} />;
}
