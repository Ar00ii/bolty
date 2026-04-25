import { TableSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <TableSkeleton crumbs={['Orders']} title="Orders" rows={8} cols={5} />;
}
