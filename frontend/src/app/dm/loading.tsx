import { ChatSkeleton } from '@/components/ui/RouteSkeletons';

export default function Loading() {
  return <ChatSkeleton crumbs={['Messages']} title="Messages" />;
}
