import { TableSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <TableSkeleton crumbs={['Inventory']} title="Inventory" rows={8} cols={4} />;
}
