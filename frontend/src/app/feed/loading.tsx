import { ChatSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <ChatSkeleton crumbs={['Feed']} title="Feed" />;
}
