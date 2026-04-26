'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /negotiations/[id] is retired. The Negotiate flow has been removed
 * from the marketplace. This route stays as a client-side redirect so
 * existing bookmarks, deep links, and server-pushed notifications don't
 * 404 after the rollout.
 */
export default function NegotiationRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orders');
  }, [router]);
  return null;
}
