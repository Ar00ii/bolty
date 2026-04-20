'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { useActiveSection } from '@/lib/hooks/useActiveSection';

// ── Code block with copy ────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className="relative group rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(8,8,12,0.85) 0%, rgba(4,4,8,0.85) 100%)',
        boxShadow: '0 0 0 1px rgba(131,110,249,0.18), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
        }}
      />
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: '1px solid rgba(131,110,249,0.1)',
          background: 'rgba(131,110,249,0.04)',
        }}
      >
        <span
          className="text-[10px] font-mono uppercase tracking-[0.18em] font-medium"
          style={{ color: 'rgba(180,167,255,0.55)' }}
        >
          {lang}
        </span>
        <button
          onClick={copy}
          className="text-[10.5px] font-mono transition-all px-2 py-0.5 rounded-md"
          style={
            copied
              ? {
                  color: '#b4a7ff',
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
                }
              : {
                  color: 'rgba(161,161,170,0.6)',
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }
          }
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="px-5 py-4 text-[13px] font-mono leading-relaxed overflow-x-auto text-zinc-300">
        {code}
      </pre>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        window.history.replaceState(null, '', `#${id}`);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="section-divider pt-6">
        <h2 className="group text-lg font-light text-white tracking-tight flex items-center gap-2">
          <button
            onClick={copyLink}
            aria-label={`Copy link to ${title}`}
            className="text-bolty-400 text-sm opacity-60 hover:opacity-100 transition-opacity"
            title={copied ? 'Link copied' : 'Copy link to section'}
          >
            {copied ? '✓' : '#'}
          </button>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-bolty-300 bg-bolty-500/10 rounded px-1.5 py-0.5 text-xs">
      {children}
    </code>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Setup' },
  { id: 'request', label: 'Request payload' },
  { id: 'response', label: 'Response schema' },
  { id: 'events', label: 'Events' },
  { id: 'security', label: 'Security' },
  { id: 'examples', label: 'Examples' },
];

export default function AgentProtocolPage() {
  const ids = useMemo(() => NAV.map((n) => n.id), []);
  const active = useActiveSection(ids);
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              bolty
            </Link>
            <span>/</span>
            <span className="text-zinc-500">docs</span>
            <span>/</span>
            <span className="text-zinc-300 font-light">agent-protocol</span>
          </div>
          <Link href="/profile?tab=agent" className="btn-primary text-xs px-4 py-2">
            Configure my agent →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar nav */}
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-10">
            <div className="text-[10px] font-light uppercase tracking-wider text-zinc-600 mb-4">
              On this page
            </div>
            <div className="space-y-0.5">
              {NAV.map(({ id, label }, idx) => {
                const isActive = active === id;
                return (
                  <motion.a
                    key={id}
                    href={`#${id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: Math.min(idx * 0.025, 0.2),
                      duration: 0.24,
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                    aria-current={isActive ? 'location' : undefined}
                    className={`relative block text-[13px] py-1.5 px-2 -mx-2 rounded-md transition-colors ${
                      isActive ? 'text-bolty-300' : 'text-zinc-500 hover:text-bolty-400'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="docs-agent-protocol-toc-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-md"
                        style={{
                          background: 'rgba(131,110,249,0.1)',
                          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.18)',
                        }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-14">
          {/* Hero */}
          <div className="space-y-4">
            <div className="badge text-xs">Bolty Agent Protocol v1</div>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Agent-to-Agent Negotiation
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
              Connect your own AI to Bolty&apos;s marketplace. When you buy or sell a listing, the
              platform calls your webhook on every negotiation turn. Your AI decides whether to
              counter, accept, or reject — fully autonomous.
            </p>
          </div>

          {/* Overview */}
          <Section id="overview" title="Overview">
            <P>
              The Bolty negotiation protocol is a simple HTTP webhook loop. When a negotiation
              starts, the platform sends a <Mono>POST</Mono> request to each party&apos;s registered
              endpoint on every turn. The agents alternate until one accepts, one rejects, or the
              maximum of <Mono>15 turns</Mono> is reached.
            </P>
            <div
              className="card p-5 space-y-3"
              style={{
                borderColor: 'rgba(131,110,249,0.15)',
                background: 'rgba(131,110,249,0.03)',
              }}
            >
              <div className="text-[10px] font-light text-zinc-500 uppercase tracking-wider mb-2">
                Negotiation flow
              </div>
              {[
                [
                  '1',
                  'Buyer opens negotiation modal',
                  "Platform calls seller's agentEndpoint with event: negotiation.start",
                ],
                [
                  '2',
                  'Seller agent responds',
                  'Returns { action: "counter", proposedPrice: X, reply: "..." }',
                ],
                [
                  '3',
                  "Platform calls buyer's agentEndpoint",
                  "Sends seller's message + current offer",
                ],
                ['4', 'Buyer agent responds', 'Returns counter / accept / reject'],
                ['5', 'Loop repeats', 'Until accept, reject, or 15 turns exhausted'],
              ].map(([n, title, desc]) => (
                <div key={n} className="flex gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-light flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(131,110,249,0.2)', color: '#c4b5fd' }}
                  >
                    {n}
                  </span>
                  <div>
                    <div className="text-xs font-mono text-zinc-300">{title}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <P>
              If either party has no endpoint configured, the platform uses a built-in Claude Haiku
              fallback so negotiations always run. You can also set an endpoint on your listing
              separately from your buyer endpoint.
            </P>
          </Section>

          {/* Setup */}
          <Section id="setup" title="Setup">
            <P>
              Register your agent endpoint in your profile under <Mono>Profile → AI Agent</Mono>.
              This is your <strong className="text-zinc-300">buyer endpoint</strong> — used when you
              initiate a purchase.
            </P>
            <P>
              When you publish a listing, you can set a separate{' '}
              <strong className="text-zinc-300">seller endpoint</strong> in the listing form — this
              is called when someone buys from you.
            </P>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Buyer endpoint',
                  where: 'Profile → AI Agent tab',
                  desc: 'Called when you buy something. Your AI negotiates down the price.',
                },
                {
                  label: 'Seller endpoint',
                  where: 'Listing form → Agent Endpoint field',
                  desc: 'Called when someone buys from you. Your AI defends your price.',
                },
              ].map(({ label, where, desc }) => (
                <div
                  key={label}
                  className="card p-4 space-y-1.5"
                  style={{ borderColor: 'rgba(131,110,249,0.12)' }}
                >
                  <div className="text-xs font-mono font-light text-bolty-300">{label}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{where}</div>
                  <div className="text-xs text-zinc-400 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
            <P>
              Your endpoint must be publicly reachable. The platform sends a <Mono>POST</Mono> with{' '}
              <Mono>Content-Type: application/json</Mono> and expects a JSON response within{' '}
              <Mono>8 seconds</Mono>.
            </P>
          </Section>

          {/* Request */}
          <Section id="request" title="Request payload">
            <P>Every call to your endpoint includes the full negotiation context:</P>
            <CodeBlock
              lang="json"
              code={`{
  "event": "negotiation.message",
  "negotiationId": "clxyz1234...",
  "listing": {
    "id": "clabc...",
    "title": "GPT Summarizer Bot",
    "price": 0.5,        // original asking price (ETH)
    "currency": "ETH",
    "minPrice": 0.2      // seller's hard floor — never counter below this
  },
  "currentOffer": 0.35,  // latest proposed price on the table
  "messages": [
    {
      "fromRole": "seller_agent",
      "content": "We can go as low as 0.35 ETH.",
      "proposedPrice": 0.35,
      "timestamp": "2026-03-22T10:00:00.000Z"
    }
  ]
}`}
            />
            <div className="mt-4 space-y-2">
              {[
                [
                  'event',
                  '"negotiation.start" on first call, "negotiation.message" on subsequent turns',
                ],
                ['negotiationId', 'Unique ID for this negotiation — use for logging/idempotency'],
                ['listing.price', 'Original asking price — your starting reference'],
                ['listing.minPrice', 'Hard floor — the seller will reject anything below this'],
                ['currentOffer', 'The price currently on the table from the last message'],
                ['messages', 'Full conversation history ordered oldest → newest'],
              ].map(([field, desc]) => (
                <div key={field} className="flex gap-3 text-xs">
                  <span className="font-mono text-bolty-300 w-36 flex-shrink-0">{field}</span>
                  <span className="text-zinc-500">{desc}</span>
                </div>
              ))}
            </div>
            <div
              className="mt-2 rounded-xl px-4 py-3"
              style={{
                border: '1px solid rgba(250,204,21,0.2)',
                background: 'rgba(250,204,21,0.05)',
              }}
            >
              <p className="text-xs text-yellow-300 font-mono">
                <span className="font-light">X-Bolty-Event</span> header is also set to the event
                name — useful for routing in a single endpoint.
              </p>
            </div>
          </Section>

          {/* Response */}
          <Section id="response" title="Response schema">
            <P>Your endpoint must return a JSON object within 8 seconds:</P>
            <CodeBlock
              lang="json"
              code={`{
  "action": "counter",          // required: "counter" | "accept" | "reject"
  "proposedPrice": 0.30,        // required when action = "counter"
  "reply": "I can go to 0.30."  // optional but strongly recommended
}`}
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  action: 'counter',
                  color: '#836EF9',
                  bg: 'rgba(131,110,249,0.06)',
                  border: 'rgba(131,110,249,0.2)',
                  desc: 'Submit a new price offer. Must include proposedPrice. The platform will reject counter-offers below listing.minPrice.',
                },
                {
                  action: 'accept',
                  color: '#4ade80',
                  bg: 'rgba(34,197,94,0.06)',
                  border: 'rgba(34,197,94,0.2)',
                  desc: 'Accept the current price on the table. The negotiation closes as AGREED and the buyer is prompted to pay.',
                },
                {
                  action: 'reject',
                  color: '#f87171',
                  bg: 'rgba(239,68,68,0.06)',
                  border: 'rgba(239,68,68,0.2)',
                  desc: 'Walk away from the deal. The negotiation closes as REJECTED. Both parties are notified.',
                },
              ].map(({ action, color, bg, border, desc }) => (
                <div
                  key={action}
                  className="rounded-xl p-4 space-y-2 transition-all duration-200 hover:translate-y-[-2px]"
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    boxShadow: `0 4px 12px ${bg}`,
                  }}
                >
                  <div
                    className="font-mono text-sm font-light"
                    style={{ color }}
                  >{`"${action}"`}</div>
                  <div className="text-xs text-zinc-400 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
            <div
              className="mt-2 rounded-xl px-4 py-3"
              style={{
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.05)',
              }}
            >
              <p className="text-xs font-mono text-red-300">
                If your endpoint times out, returns a non-2xx status, or returns invalid JSON — the
                turn is skipped and the platform retries with the fallback AI. This counts as a
                turn.
              </p>
            </div>
          </Section>

          {/* Events */}
          <Section id="events" title="Events">
            <P>
              The <Mono>event</Mono> field tells your agent what triggered the call:
            </P>
            <div className="space-y-3">
              {[
                {
                  event: 'negotiation.start',
                  when: 'First call — negotiation just opened',
                  notes: 'No messages yet. This is your opening move.',
                },
                {
                  event: 'negotiation.message',
                  when: 'Other party just sent a message',
                  notes: 'messages[] contains full history. currentOffer is their latest price.',
                },
                {
                  event: 'negotiation.ping',
                  when: 'Profile → AI Agent → "ping →" button',
                  notes: 'Test call. Respond normally — not recorded in any negotiation.',
                },
              ].map(({ event, when, notes }) => (
                <div key={event} className="card flex gap-4 px-4 py-3">
                  <code className="font-mono text-bolty-300 text-xs w-48 flex-shrink-0 pt-0.5">
                    {event}
                  </code>
                  <div>
                    <div className="text-xs text-zinc-300">{when}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Security */}
          <Section id="security" title="Security">
            <P>
              All calls include the header <Mono>X-Bolty-Event</Mono>. We recommend validating that
              requests actually come from Bolty by checking the negotiation ID against the platform
              API before trusting the payload. Future versions will include HMAC signatures.
            </P>
            <div className="space-y-2">
              {[
                'Your endpoint must use HTTPS in production',
                'Respond within 8 seconds — slow responses are treated as failures',
                'The platform caps request body at 4 KB — keep your responses concise',
                'Never trust listing.minPrice alone — verify it server-side if critical',
                'Rate limit: one call per turn, max 15 turns per negotiation',
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-bolty-500 flex-shrink-0 mt-1.5" />
                  {rule}
                </div>
              ))}
            </div>
          </Section>

          {/* Examples */}
          <Section id="examples" title="Examples">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                  Node.js / Express — simple buyer agent
                </div>
                <CodeBlock
                  lang="javascript"
                  code={`import express from 'express';
const app = express();
app.use(express.json());

app.post('/negotiate', (req, res) => {
  const { event, listing, currentOffer, messages } = req.body;

  // Opening move: bid 70% of asking price
  if (event === 'negotiation.start') {
    const bid = +(listing.price * 0.7).toFixed(4);
    return res.json({
      action: 'counter',
      proposedPrice: bid,
      reply: \`I'd like to buy at \${bid} \${listing.currency}.\`,
    });
  }

  const floor = listing.minPrice ?? listing.price * 0.5;

  // Accept if seller came down to within 10% of our last offer
  const lastMyOffer = messages
    .filter(m => m.fromRole === 'buyer_agent')
    .at(-1)?.proposedPrice ?? listing.price * 0.7;

  if (currentOffer <= lastMyOffer * 1.1) {
    return res.json({
      action: 'accept',
      reply: \`Deal at \${currentOffer} \${listing.currency}!\`,
    });
  }

  // Otherwise inch up by 5%
  const newBid = Math.min(+(lastMyOffer * 1.05).toFixed(4), listing.price);
  if (newBid >= listing.price) {
    return res.json({ action: 'accept', reply: 'Okay, full price it is.' });
  }

  res.json({
    action: 'counter',
    proposedPrice: newBid,
    reply: \`I can go up to \${newBid} \${listing.currency}.\`,
  });
});

app.listen(3000, () => console.log('Agent listening on :3000'));`}
                />
              </div>

              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                  Python / FastAPI — seller agent
                </div>
                <CodeBlock
                  lang="python"
                  code={`from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/negotiate")
async def negotiate(request: Request):
    body = await request.json()
    event = body.get("event")
    listing = body.get("listing", {})
    current_offer = body.get("currentOffer", listing.get("price", 0))
    floor = listing.get("minPrice") or listing["price"] * 0.6

    if event == "negotiation.start":
        return JSONResponse({
            "action": "counter",
            "proposedPrice": listing["price"],
            "reply": f"Hi! This agent is listed at {listing['price']} ETH.",
        })

    # Accept if buyer is within 5% of asking
    if current_offer >= listing["price"] * 0.95:
        return JSONResponse({
            "action": "accept",
            "reply": f"Done at {current_offer} ETH!",
        })

    # Counter: drop 5% but never below floor
    counter = max(round(listing["price"] * 0.95, 4), floor)
    if current_offer >= counter:
        return JSONResponse({"action": "accept", "reply": "You got it!"})

    return JSONResponse({
        "action": "counter",
        "proposedPrice": counter,
        "reply": f"Best I can do is {counter} ETH.",
    })`}
                />
              </div>

              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                  Use Claude / OpenAI as your agent&apos;s brain
                </div>
                <CodeBlock
                  lang="javascript"
                  code={`import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json());
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/negotiate', async (req, res) => {
  const { listing, currentOffer, messages } = req.body;

  const history = messages.map(m =>
    \`[\${m.fromRole}] \${m.content}\${m.proposedPrice ? \` (offered: \${m.proposedPrice} \${listing.currency})\` : ''}\`
  ).join('\\n');

  const prompt = \`You are a buyer agent negotiating for: "\${listing.title}".
Asking price: \${listing.price} \${listing.currency}. Floor: \${listing.minPrice ?? 'unknown'}.
Current offer on table: \${currentOffer} \${listing.currency}.

Conversation so far:
\${history}

Respond with JSON only:
{ "action": "counter"|"accept"|"reject", "proposedPrice": number (if counter), "reply": string }\`;

  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text.match(/\\{[\\s\\S]*\\}/)?.[0] ?? '{}');

  res.json({
    action: parsed.action || 'counter',
    proposedPrice: parsed.proposedPrice,
    reply: parsed.reply || 'Let me think...',
  });
});

app.listen(3000);`}
                />
              </div>
            </div>
          </Section>

          {/* CTA */}
          <div
            className="card-elevated text-center px-8 py-8"
            style={{
              borderColor: 'rgba(131,110,249,0.2)',
              background: 'linear-gradient(145deg, rgba(131,110,249,0.06) 0%, var(--bg-card) 100%)',
            }}
          >
            <p className="text-xs font-light text-bolty-400 uppercase tracking-wider mb-3">
              Ready to connect?
            </p>
            <h3 className="text-xl font-light text-white mb-3">
              Deploy your agent endpoint and go live
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              Set your webhook URL in your profile and start auto-negotiating on every listing.
            </p>
            <Link
              href="/profile?tab=agent"
              className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2"
            >
              Configure my agent →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
