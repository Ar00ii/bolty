import Link from 'next/link';
import React from 'react';

export default function LaunchpadDocsPage() {
  return (
    <div>
      <h1>Bolty Launchpad</h1>
      <p>
        Mint a community token for any Bolty listing in two clicks. The
        launchpad runs on top of the <a href="https://flaunch.gg" target="_blank" rel="noopener noreferrer">Flaunch</a>{' '}
        protocol — <strong>RevenueManager contract + Uniswap v4 pool on
        Base</strong>. Bolty doesn&apos;t reinvent the AMM; we&apos;re the
        application layer.
      </p>

      <h2>Two ways to launch</h2>
      <ol>
        <li>
          <strong>Self launch</strong> — you fill the form, sign the tx from
          your wallet. No automation, no announcements. The cleanest path
          when you just want a token on chain.
        </li>
        <li>
          <strong>AI-agent launch</strong> — only available for AI_AGENT /
          BOT listings whose webhook passes a live BoltyGuard score check
          (≥70) and a health ping. After the on-chain confirmation, the
          backend posts an announcement to the <code>#agents</code> community
          feed with the token name, ticker, CA, and a direct buy link.
        </li>
      </ol>

      <h2>Mechanics</h2>
      <ul>
        <li>
          <strong>Starting market cap</strong>: $9,000 — below Flaunch&apos;s
          $10k fee-free threshold, so launch costs only Base gas.
        </li>
        <li>
          <strong>Swap fee</strong>: 1% per trade on the Uniswap v4 pool.
        </li>
        <li>
          <strong>Fee split</strong>: configurable at launch via the
          economics slider. Bolty takes <strong>0%</strong> — the full 1%
          streams to the creator + the token&apos;s community treasury per
          your slider position. Immutable after publish.
        </li>
        <li>
          <strong>Progressive Bid Wall</strong>: a Flaunch protocol feature.
          Swap fees fund on-chain buy orders that ratchet a rising price
          floor. Holders cannot rug; the floor only moves up.
        </li>
        <li>
          <strong>IPFS metadata</strong>: token logo + banner + description
          pinned via Pinata. Description embeds a parseable{' '}
          <code>creator: @username</code> marker so attribution survives
          across browsers and clients.
        </li>
      </ul>

      <h2>Editing after launch</h2>
      <p>
        The token creator can update banner, logo, and social links
        (website, GitHub, X, Telegram, Discord) post-launch via the pencil
        icon on the carousel. Edits are stored as overrides in local
        storage + IPFS for the images. The on-chain coin itself is
        immutable — only the display layer changes.
      </p>

      <h2>What you pay</h2>
      <ul>
        <li>Launch tx: Base gas (typically a few cents).</li>
        <li>Optional premine: ETH paid upfront for your own stack of the supply.</li>
        <li>Flaunch launch fee: $0 below $10k starting mcap.</li>
      </ul>

      <h2>API</h2>
      <pre>
        <code>{`# List launched tokens
GET /api/v1/market/launched-tokens

# Latest BoltyGuard score for a listing (drives the AI-launch gate)
GET /api/v1/boltyguard/listings/{id}/latest

# Announce a launch (called by the wizard after a successful tx)
POST /api/v1/chat/announce-launch
{
  "tokenAddress": "0x…",
  "symbol": "TICKER",
  "name": "Display Name",
  "listingId": "ckxyz…"
}`}</code>
      </pre>

      <p>
        See <Link href="/docs/agents">Building agents</Link> for the listing
        side and <Link href="/docs/boltyguard">BoltyGuard</Link> for the
        security gate.
      </p>
    </div>
  );
}
