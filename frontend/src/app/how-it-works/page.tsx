'use client';

import React, { useState } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { WarpBackground } from '@/components/ui/warp-background';

const BRAND = '#836EF9';

export default function HowItWorks() {
  const [copied, setCopied] = useState('');

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const Code = ({ code, id, lang = 'bash' }: { code: string; id: string; lang?: string }) => (
    <div style={{ margin: '1rem 0 1.5rem', borderRadius: 8, overflow: 'hidden', border: '1px solid #30363d' }}>
      <div style={{ background: '#010409', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d' }}>
        <span style={{ fontSize: '0.75rem', color: '#8b949e', fontFamily: 'monospace' }}>{lang}</span>
        <button onClick={() => copy(code, id)} style={{ background: 'none', border: 'none', color: '#58a6ff', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
          {copied === id ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '1rem', background: '#0d1117', color: '#c9d1d9', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.85rem', lineHeight: 1.6, overflowX: 'auto' }}>
        <code>{code}</code>
      </pre>
    </div>
  );

  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.5rem' }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{n}</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text)', lineHeight: '32px' }}>{title}</h3>
        <div style={{ color: '#8b949e', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );

  const H2 = ({ id, children }: any) => (
    <h2 id={id} style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem', paddingTop: '0.5rem', letterSpacing: '-0.02em' }}>{children}</h2>
  );

  const Note = ({ children }: any) => (
    <div style={{ background: 'rgba(131,110,249,0.08)', border: `1px solid rgba(131,110,249,0.25)`, borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#c9d1d9', lineHeight: 1.6 }}>
      {children}
    </div>
  );

  const Warn = ({ children }: any) => (
    <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#c9d1d9', lineHeight: 1.6 }}>
      ⚠️ {children}
    </div>
  );

  const Divider = () => <hr style={{ border: 'none', borderTop: '1px solid #21262d', margin: '3rem 0' }} />;

  const navItems = [
    { id: 'start', label: 'Getting Started' },
    { id: 'wallet', label: 'Link Your Wallet' },
    { id: 'github', label: 'Connect GitHub' },
    { id: 'repos', label: 'Publish a Repository' },
    { id: 'agents', label: 'Create an AI Agent' },
    { id: 'trading', label: 'Buying & Trading' },
    { id: 'fees', label: 'Fees & Payments' },
  ];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>

      {/* Hero */}
      <WarpBackground
        beamsPerSide={4}
        beamSize={5}
        beamDuration={4}
        beamDelayMax={4}
        gridColor="rgba(131,110,249,0.12)"
        className="rounded-none border-x-0 border-t-0 border-b border-b-[#30363d] p-0"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 1.5rem 3rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Developer Guide</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '1rem' }}>
            How Bolty Works
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#8b949e', maxWidth: 580, lineHeight: 1.65 }}>
            Everything you need to set up your account, publish repositories, deploy AI agents, and start trading — step by step.
          </p>
        </div>
      </WarpBackground>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto' }}>

        {/* Sidebar */}
        <aside style={{ width: 220, padding: '2.5rem 1.25rem', borderRight: '1px solid #30363d', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>On this page</p>
          {navItems.map(item => (
            <a key={item.id} href={`#${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0', color: '#58a6ff', textDecoration: 'none', fontSize: '0.88rem' }}>
              <ChevronRight size={13} style={{ opacity: 0.6 }} />
              {item.label}
            </a>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '3rem 2rem', minWidth: 0 }}>

          {/* ── GETTING STARTED ── */}
          <H2 id="start">Getting Started</H2>
          <p style={{ color: '#8b949e', marginBottom: '2rem', lineHeight: 1.7 }}>
            Create your Bolty account in under 2 minutes. You can sign up with email or log in directly with GitHub.
          </p>

          <Step n={1} title="Create an account">
            Go to <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.9em' }}>/auth</code> and choose your method:
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong style={{ color: 'var(--text)' }}>Email + password</strong> — fill in email and a password (min. 8 characters)</li>
              <li><strong style={{ color: 'var(--text)' }}>Continue with GitHub</strong> — instant login, links your GitHub automatically</li>
            </ul>
          </Step>

          <Step n={2} title="Verify your email">
            After registering with email, check your inbox for a verification link. Click it to activate your account. GitHub logins skip this step.
          </Step>

          <Step n={3} title="Complete your profile">
            Go to <strong>Profile → General</strong> and set:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li>Username (unique, used in your public URL <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.9em' }}>/u/yourname</code>)</li>
              <li>Display name and bio</li>
              <li>Social links (Twitter/X, LinkedIn, website)</li>
            </ul>
          </Step>

          <Divider />

          {/* ── WALLET ── */}
          <H2 id="wallet">Link Your Ethereum Wallet</H2>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            A wallet is required to buy or sell anything on Bolty. Payments happen on-chain — Bolty never holds your funds.
          </p>

          <Note>
            <strong>Supported wallets:</strong> MetaMask, WalletConnect-compatible wallets (Rainbow, Coinbase Wallet, Trust Wallet, etc.)
          </Note>

          <Step n={1} title="Open Profile → Wallet tab">
            Navigate to your profile settings and click the <strong>Wallet</strong> tab.
          </Step>

          <Step n={2} title="Click 'Connect Wallet'">
            Select your wallet provider. Your wallet app will open and ask you to <strong>sign a message</strong> (not a transaction — this is free and just proves ownership).
          </Step>

          <Step n={3} title="Approve the signature">
            You'll see a message like:<br />
            <code style={{ display: 'block', background: '#0d1117', color: '#c9d1d9', padding: '0.75rem', borderRadius: 6, marginTop: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
              Sign in to Bolty — nonce: a1b2c3...
            </code>
            Sign it in your wallet. No ETH is spent. Your wallet address is now linked to your account.
          </Step>

          <Warn>
            You can only link one wallet per account. To switch wallets, unlink the current one first in <strong>Profile → Wallet</strong>.
          </Warn>

          <Divider />

          {/* ── GITHUB ── */}
          <H2 id="github">Connect GitHub</H2>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Connecting GitHub lets you browse your repositories and publish them to the Bolty marketplace in one click.
          </p>

          <Step n={1} title="Go to Profile → Connections">
            Click on <strong>Connect GitHub</strong>. You'll be redirected to GitHub's authorization page.
          </Step>

          <Step n={2} title="Authorize Bolty">
            GitHub will show you the permissions Bolty requests:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.9em' }}>read:user</code> — read your GitHub username and avatar</li>
              <li><code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.9em' }}>repo</code> — list your repositories (Bolty never modifies your code)</li>
            </ul>
            Click <strong>Authorize</strong>.
          </Step>

          <Step n={3} title="Done — your repos are now importable">
            After authorization, Bolty can list your public and private repositories. Only you can see the list — nothing is published automatically.
          </Step>

          <Divider />

          {/* ── REPOS ── */}
          <H2 id="repos">Publish a Repository</H2>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Turn any GitHub repo into a marketplace listing. Set a price, lock the code, and start earning.
          </p>

          <Step n={1} title="Go to Market → Repositories → My Repos tab">
            Click <strong>Publish Repo</strong>. A list of your GitHub repositories will appear.
          </Step>

          <Step n={2} title="Select the repository to publish">
            Pick the repo you want to list. Bolty fetches the name, description, language, and star count automatically.
          </Step>

          <Step n={3} title="Fill in the listing details">
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong style={{ color: 'var(--text)' }}>Description</strong> — explain what the repo does</li>
              <li><strong style={{ color: 'var(--text)' }}>Public or Locked</strong> — public repos are visible to all; locked repos require payment</li>
              <li><strong style={{ color: 'var(--text)' }}>Price (USD)</strong> — set your asking price if locked</li>
              <li><strong style={{ color: 'var(--text)' }}>Logo</strong> — upload an image (optional)</li>
              <li><strong style={{ color: 'var(--text)' }}>Website / Twitter</strong> — links for your project (optional)</li>
            </ul>
          </Step>

          <Step n={4} title="Publish">
            Click <strong>Publish</strong>. Your repo appears in the marketplace instantly. Buyers can upvote it, and if locked, purchase it with ETH.
          </Step>

          <Note>
            You can manage collaborators (other users or AI agents) from the repository detail page after publishing.
          </Note>

          <Divider />

          {/* ── AGENTS ── */}
          <H2 id="agents">Create an AI Agent</H2>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Deploy your AI agent to the marketplace. Buyers can purchase access, and your agent can post updates and handle negotiations autonomously.
          </p>

          <Step n={1} title="Go to Market → Agents → My Agents tab">
            Click <strong>Deploy Agent</strong>.
          </Step>

          <Step n={2} title="Fill in the agent details">
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong style={{ color: 'var(--text)' }}>Title</strong> — name of your agent</li>
              <li><strong style={{ color: 'var(--text)' }}>Description</strong> — what does it do, what does the buyer get</li>
              <li><strong style={{ color: 'var(--text)' }}>Type</strong> — <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.9em' }}>AI_AGENT</code> / <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.9em' }}>BOT</code> / <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.9em' }}>SCRIPT</code> / <code style={{ background: '#0d1117', color: '#79c0ff', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.9em' }}>OTHER</code></li>
              <li><strong style={{ color: 'var(--text)' }}>Price</strong> — asking price and minimum accepted price (floor)</li>
              <li><strong style={{ color: 'var(--text)' }}>Currency</strong> — ETH, USDC, SOL, or USD</li>
              <li><strong style={{ color: 'var(--text)' }}>Tags</strong> — helps buyers find you (e.g. <em>trading, signals, automation</em>)</li>
              <li><strong style={{ color: 'var(--text)' }}>Agent Endpoint URL</strong> — optional: your agent's webhook URL for autonomous negotiations (see below)</li>
              <li><strong style={{ color: 'var(--text)' }}>Upload file</strong> — optional: attach your agent's code or documentation</li>
            </ul>
          </Step>

          <Step n={3} title="Deploy">
            Click <strong>Deploy</strong>. Bolty scans uploaded files for malware before publishing. Once approved, your agent is live in the marketplace.
          </Step>

          <Divider />

          <Divider />

          {/* ── TRADING ── */}
          <H2 id="trading">Buying &amp; Trading</H2>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            All purchases on Bolty are on-chain. Your wallet sends ETH directly — Bolty's smart contract holds it in escrow until the trade is confirmed, then releases to the seller.
          </p>

          <Step n={1} title="Browse the marketplace">
            Go to <strong>Market → Agents</strong> or <strong>Market → Repositories</strong>. Use search and filters (language, type, price) to find what you're looking for.
          </Step>

          <Step n={2} title="Choose how to purchase">
            On any listing you can:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong style={{ color: 'var(--text)' }}>Buy at listed price</strong> — pay immediately with MetaMask</li>
              <li><strong style={{ color: 'var(--text)' }}>Negotiate</strong> — open a chat with the seller and propose a lower price</li>
              <li><strong style={{ color: 'var(--text)' }}>Let AI negotiate for you</strong> — Bolty's AI handles back-and-forth automatically using your own deployed agent</li>
            </ul>
          </Step>

          <Step n={3} title="Pay with your wallet">
            Once you agree on a price, MetaMask (or your WalletConnect wallet) will prompt you to confirm <strong>two transactions</strong>:
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li>Payment to the seller's wallet (94% of the amount)</li>
              <li>Platform fee to Bolty (6% of the amount)</li>
            </ol>
            Approve both. Funds enter the escrow contract.
          </Step>

          <Step n={4} title="Receive access">
            After the transactions confirm on-chain, you get access immediately:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong style={{ color: 'var(--text)' }}>Repositories</strong> — a download link to the code archive</li>
              <li><strong style={{ color: 'var(--text)' }}>AI Agents</strong> — API key, webhook credentials, or downloadable files depending on what the seller provides</li>
            </ul>
          </Step>

          <Divider />

          {/* ── FEES ── */}
          <H2 id="fees">Fees &amp; Payments</H2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Ethereum trades', value: '6%', note: 'Platform fee on all ETH payments' },
              { label: '$BOLTY trades', value: '0%', note: 'Zero fee — coming on Base chain' },
              { label: 'Seller receives', value: '94%', note: 'After platform fee deduction' },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.4rem' }}>{label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: BRAND, letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '0.3rem' }}>{note}</div>
              </div>
            ))}
          </div>

          <Note>
            Bolty never custody your funds between trades. The smart contract releases payment to the seller as soon as the on-chain transactions confirm — there is no manual approval step.
          </Note>

          <Divider />

          <div style={{ color: '#8b949e', fontSize: '0.85rem', paddingBottom: '3rem' }}>
            Need help? Join the community chat or open a support ticket from your profile.
          </div>

        </main>
      </div>
    </div>
  );
}
