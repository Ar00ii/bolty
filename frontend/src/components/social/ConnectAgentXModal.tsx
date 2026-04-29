'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CheckCircle2, ExternalLink, KeyRound, Loader2, Plus, Twitter, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api/client';

/**
 * Connect-X picker modal opened from /launchpad's "Launch with AI agent"
 * button. Lists every AI_AGENT listing the user owns + its current X
 * connection status, with one-click jump-offs to the per-listing
 * setup-x page (where keys + OAuth happen).
 *
 * The button on the launchpad isn't there to PUBLISH an agent — it's
 * there to let the user connect X to an agent they already own. If
 * they have none, we show the publish CTA as a last-resort fallback.
 */

interface AgentXStatus {
  configured: boolean;
  connected: boolean;
  screenName?: string | null;
  postsLast24h?: number;
}

interface OwnedAgent {
  listingId: string;
  title: string;
  listingStatus: string;
  createdAt: string;
  x: AgentXStatus;
}

export function ConnectAgentXModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [agents, setAgents] = useState<OwnedAgent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await api.get<OwnedAgent[]>('/social/agent-x/owned');
      setAgents(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setAgents([]);
      setError(err instanceof ApiError ? err.message : 'Could not load your agents');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setAgents(null);
    void load();
  }, [open, load]);

  // Lock body scroll while open + close on Escape so the modal feels
  // like every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="connect-agent-x-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] grid place-items-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 8, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: '#0d0d12',
              border: '1px solid rgba(20,241,149,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(20,241,149,0.55) 50%, transparent 100%)',
              }}
            />
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
                <h3 className="text-[14px] text-white font-light">Connect X to an agent</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </header>

            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              <p className="text-[12px] text-zinc-400 font-light leading-relaxed mb-4">
                Each agent connects its own X Developer App + X account so the
                agent can post launch tweets and updates from its own handle.
                Pick which agent to set up.
              </p>

              {agents === null ? (
                <div
                  className="rounded-xl px-4 py-6 text-center text-[12px] text-zinc-500"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5" />
                  Loading your agents…
                </div>
              ) : agents.length === 0 ? (
                <div
                  className="rounded-xl px-5 py-8 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Bot className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                  <p className="text-[12.5px] text-zinc-300 font-light mb-1">
                    You don&apos;t have any AI agents yet.
                  </p>
                  <p className="text-[11px] text-zinc-500 font-light mb-4">
                    Publish one first — you&apos;ll set up X for it on the next page.
                  </p>
                  <Link
                    href="/market/agents/publish"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-light text-white transition"
                    style={{
                      background: 'rgba(20,241,149,0.22)',
                      boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.4)',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Publish an AI agent
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {agents.map((a) => (
                    <li
                      key={a.listingId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Bot className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-white font-light truncate">{a.title}</div>
                        <div className="text-[10.5px] text-zinc-500 truncate font-mono">
                          {a.x.connected ? (
                            <span className="text-emerald-300">✓ @{a.x.screenName}</span>
                          ) : a.x.configured ? (
                            <span className="text-amber-300">⚠ keys saved · OAuth pending</span>
                          ) : (
                            <span className="text-rose-300">⨯ X not configured</span>
                          )}
                          {a.listingStatus !== 'ACTIVE' && (
                            <>
                              {' · '}
                              <span className="text-amber-400">{a.listingStatus.toLowerCase()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/market/agents/${a.listingId}/setup-x`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-light px-2.5 py-1.5 rounded-md text-white transition"
                        style={{
                          background: a.x.connected ? 'rgba(255,255,255,0.04)' : 'rgba(20,241,149,0.22)',
                          border: `1px solid ${a.x.connected ? 'rgba(255,255,255,0.08)' : 'rgba(20,241,149,0.4)'}`,
                        }}
                      >
                        {a.x.connected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Manage
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3 h-3" /> Setup X
                          </>
                        )}
                      </Link>
                      <Link
                        href={`/market/agents/${a.listingId}`}
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition"
                        aria-label="Open agent listing"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <div className="mt-3 rounded-md px-3 py-2 text-[11.5px] text-rose-300"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {agents !== null && agents.length > 0 && (
              <footer className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/market/agents/publish"
                  onClick={onClose}
                  className="text-[11.5px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Publish another agent
                </Link>
                <Link
                  href="/docs/launchpad/agent-x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11.5px] text-[#b4a7ff] hover:text-white underline decoration-dotted underline-offset-2"
                >
                  How does this work? →
                </Link>
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
