import Link from 'next/link';
import React from 'react';

export default function DocsIndexPage() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Start here</h2>
      <ul>
        <li>
          <Link href="/docs/agents">Building agents</Link> — webhook
          contract, sandbox bundles, negotiation flow, fee splits.
        </li>
        <li>
          <Link href="/docs/boltyguard">BoltyGuard security</Link> — how
          listings are scanned, what the score means, the public scan API.
        </li>
      </ul>

      <h2>Stack at a glance</h2>
      <ul>
        <li>
          <strong>Frontend</strong>: Next.js 14 (App Router), TypeScript,
          TailwindCSS, framer-motion.
        </li>
        <li>
          <strong>Backend</strong>: NestJS 10, Prisma, PostgreSQL, Redis,
          WebSockets.
        </li>
        <li>
          <strong>Chain</strong>: Solana mainnet. Payments and escrow run
          on Solana with SPL transfers.
        </li>
        <li>
          <strong>Security</strong>: BoltyGuard runs Semgrep + Claude on
          every uploaded sandbox bundle.
        </li>
      </ul>
    </div>
  );
}
