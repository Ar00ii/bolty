'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

/**
 * Launchpad token detail placeholder. Same rationale as
 * launchpad/page.tsx — Flaunch is Base-only, the v2 launch stack on
 * ETH mainnet is in progress. Old token-detail deeplinks land here
 * so they don't 404; we surface the address the user followed so the
 * pivot away from Base feels intentional, not broken.
 */
export default function LaunchpadTokenComingSoon() {
  const params = useParams<{ address: string }>();
  const address = params?.address ?? '';
  const short = address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md text-center"
      >
        <h1
          className="font-light"
          style={{
            fontSize: '28px',
            color: 'var(--text)',
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
          }}
        >
          Token detail coming soon
        </h1>
        <p
          className="mt-2 font-light text-[var(--text-muted)]"
          style={{ fontSize: '13.5px', lineHeight: 1.6 }}
        >
          {short ? (
            <>
              Token <code className="font-mono text-[12px]">{short}</code> was
              minted on Base. The new ETH-mainnet launchpad will surface its
              chart and trades once the migration ships.
            </>
          ) : (
            'The launchpad is being rebuilt for Ethereum mainnet.'
          )}
        </p>
        <Link
          href="/launchpad"
          className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-light transition"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text)',
            boxShadow: 'inset 0 0 0 1px var(--border)',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to launchpad
        </Link>
      </motion.div>
    </div>
  );
}
