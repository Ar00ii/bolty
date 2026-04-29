'use client';

import { Loader2, Twitter, X as XIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { api, ApiError } from '@/lib/api/client';

/**
 * Launch-tweet modal.
 *
 * Pops up after an AI agent successfully launches a token. Pre-fills a
 * tweet draft from the token metadata, lets the user edit before
 * sending, and posts via the backend on confirm. The send button is
 * disabled until the user has connected X — in that case we show a
 * Connect button that takes them through OAuth and brings them back
 * here.
 */

interface LaunchTweetToken {
  name: string;
  symbol: string;
  tokenAddress: string;
  url: string; // full link to the token's launchpad page (e.g. https://www.atlas.market/launchpad/0x...)
  agentName?: string | null;
}

type Status =
  | { connected: false }
  | {
      connected: true;
      screenName: string;
      postsLast24h: number;
      dailyCap: number;
    };

const MAX_LEN = 280;

function defaultDraft(token: LaunchTweetToken): string {
  const sym = `$${token.symbol.toUpperCase()}`;
  const by = token.agentName ? ` by ${token.agentName}` : '';
  return `Just launched ${sym} on Atlas${by}.\n\nChart, holders, and CA: ${token.url}`;
}

export function LaunchTweetModal({
  open,
  token,
  onClose,
}: {
  open: boolean;
  token: LaunchTweetToken | null;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ id: string } | null>(null);

  const remaining = useMemo(() => MAX_LEN - text.length, [text]);
  const tooLong = remaining < 0;

  // Reset draft + load status whenever the modal opens for a new token.
  useEffect(() => {
    if (!open || !token) return;
    setText(defaultDraft(token));
    setError(null);
    setPosted(null);
    setStatus(null);
    api
      .get<Status>('/social/x/status')
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, [open, token]);

  const handleConnect = useCallback(async () => {
    try {
      // Bring the user right back to the page they're on so the modal
      // can be re-opened by the parent if it wants. The handle ends up
      // in ?x_connected on return; the page can pick it up.
      const ret = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/launchpad';
      const { url } = await api.get<{ url: string }>(
        `/social/x/connect-url?returnTo=${encodeURIComponent(ret)}`,
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start X OAuth');
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (tooLong || !text.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await api.post<{ id: string; text: string }>('/social/x/post', { text });
      setPosted({ id: res.id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post tweet');
    } finally {
      setPosting(false);
    }
  }, [text, tooLong]);

  if (!open || !token) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-5"
        style={{
          background: '#0d0d12',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Twitter className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
            <h3 className="text-[14px] text-white font-light">Tweet your launch</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <XIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {posted ? (
          <div
            className="rounded-lg p-4 text-center"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <div className="text-[13px] text-emerald-300 font-light mb-2">Tweet posted.</div>
            <a
              href={
                status?.connected
                  ? `https://x.com/${status.screenName}/status/${posted.id}`
                  : `https://x.com/i/web/status/${posted.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-atlas-300 hover:text-white underline-offset-2 hover:underline"
            >
              View on X
            </a>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full rounded-lg p-3 text-[13px] text-white font-light resize-none outline-none"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              placeholder="What should your agent say?"
            />

            <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
              <span className={remaining < 20 ? 'text-amber-400' : 'text-zinc-500'}>
                {remaining}
                <span className="text-zinc-600"> chars left</span>
              </span>
              {status?.connected && (
                <span className="text-zinc-500">
                  posting as <span className="text-zinc-300">@{status.screenName}</span>
                </span>
              )}
            </div>

            {error && (
              <div
                className="mt-3 rounded-md px-3 py-2 text-[11.5px]"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-light px-3 py-1.5 rounded-md text-zinc-400 hover:text-white transition"
              >
                Maybe later
              </button>
              {status?.connected ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={posting || tooLong || !text.trim()}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
                  style={{
                    background: 'rgba(20,241,149,0.18)',
                    color: '#e4d8ff',
                    border: '1px solid rgba(20,241,149,0.4)',
                  }}
                >
                  {posting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Twitter className="w-3 h-3" strokeWidth={2} />
                  )}
                  {posting ? 'Posting…' : 'Send tweet'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition"
                  style={{
                    background: 'rgba(20,241,149,0.18)',
                    color: '#e4d8ff',
                    border: '1px solid rgba(20,241,149,0.4)',
                  }}
                >
                  <Twitter className="w-3 h-3" strokeWidth={2} />
                  Connect X to post
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
