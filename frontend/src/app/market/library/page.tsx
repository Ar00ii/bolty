'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

/**
 * /market/library has been folded into /inventory. The library's two
 * views become inventory tabs:
 *   - "Owned"  → already covered by /inventory's "Purchased" tab
 *   - "Saved"  → /inventory?tab=saved
 *
 * This route stays as a client-side redirect so existing bookmarks,
 * deep links, and the legacy `g+l` keyboard shortcut don't 404.
 */
export default function LibraryRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LibraryRedirect />
    </Suspense>
  );
}

function LibraryRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const target = params?.get('tab') === 'saved' ? '/inventory?tab=saved' : '/inventory';
    router.replace(target);
  }, [router, params]);
  return null;
}
