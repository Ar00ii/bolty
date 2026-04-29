import type { Metadata } from 'next';
import React from 'react';

import './_components/docs-prose.css';
import { DocsHero, DocsSidebar } from './_components/DocsChrome';

export const metadata: Metadata = {
  title: 'Atlas Docs',
  description: 'Build, secure, and ship AI agents on Atlas.',
};

/**
 * Docs surface chrome.
 *
 * Visual goals (mirroring the landing + launchpad surfaces):
 *  - Pure black background.
 *  - Brand purple (#14F195) as the only chromatic accent — links,
 *    sidebar active state, gradient hero word, list bullets,
 *    blockquote rail.
 *  - Default to font-weight 300 EVERYWHERE per the project design
 *    language. <strong> ramps to 400 — readable as bold against 300
 *    body without screaming.
 *  - Heavy whitespace + generous line-height (1.75) so long
 *    technical docs are readable.
 *
 * The branded prose CSS lives in docs-prose.css, scoped via the
 * .docs-prose class on the main column so the nav, hero, and any
 * other chrome stay unaffected.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative" style={{ background: '#000000' }}>
      {/* Top hero — full-width, sits above the grid. */}
      <DocsHero />

      {/* Content grid: sidebar (lg+) + main column. */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-24 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <aside className="lg:sticky lg:top-10 lg:self-start lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto pr-2">
          <DocsSidebar />
        </aside>
        <main className="docs-prose">{children}</main>
      </div>
    </div>
  );
}
