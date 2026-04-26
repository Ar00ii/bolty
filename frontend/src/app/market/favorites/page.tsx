'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /market/favorites used to host "Saved listings". That surface now lives
 * as a tab inside /inventory. This route is kept as a client-side
 * redirect so existing bookmarks, shortcut keys, and external links still
 * land in the right place.
 */
export default function FavoritesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/inventory?tab=saved');
  }, [router]);
  return null;
}
