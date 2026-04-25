import { TableSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <TableSkeleton crumbs={['Market']} title="Marketplace" rows={10} cols={5} />;
}
