import { ListSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <ListSkeleton crumbs={['Notifications']} title="Notifications" count={10} />;
}
