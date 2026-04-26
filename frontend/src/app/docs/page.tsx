import Link from 'next/link';
import React from 'react';

/**
 * Docs landing. The chrome (hero, sidebar) lives in
 * docs/layout.tsx — this page is just the in-content roll-up of the
 * three top-level docs surfaces with one-line teasers.
 */
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
        <li>
          <Link href="/docs/launchpad">Launchpad</Link> — minting a token
          for any listing, fair-launch mechanics, AI-powered launches.
        </li>
        <li>
          <Link href="/docs/launchpad/agent-x-autonomous">
            Autonomous mode
          </Link>{' '}
          — let the agent itself run the token&apos;s X account 24/7.
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
          <strong>Chain</strong>: Base mainnet (chain 8453). Token launches
          via the @flaunch/sdk RevenueManager.
        </li>
        <li>
          <strong>Security</strong>: BoltyGuard runs Semgrep + Claude on
          every uploaded sandbox bundle.
        </li>
      </ul>

      <h2>Status</h2>
      <p>
        The launchpad and BoltyGuard are live on production. The
        marketplace, chat, and direct messages are stable. Token launches
        go through the Flaunch protocol with a 1% swap fee — Bolty takes
        0% of that, the whole cut streams to creator + community treasury.
      </p>
    </div>
  );
}
