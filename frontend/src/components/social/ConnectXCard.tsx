'use client';

import { Loader2, Twitter, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api/client';

/**
 * Connect-X (Twitter) card.
 *
 * Renders one of three states:
 *   • not connected → "Connect X" button kicks off OAuth
 *   • connected     → "Posting as @handle" + Disconnect + posts-this-24h
 *   • error         → red banner with the message X returned
 *
 * The OAuth flow is a full redirect: we hit /social/x/connect-url to
 * get the authorize URL, then `window.location.href = url`. X redirects
 * back to /api/v1/social/x/callback which finishes the exchange and
 * sends the user to /profile?x_connected=@handle so this component
 * can pick up the success on its first effect.
 */

type Status =
  | { connected: false }
  | {
      connected: true;
      screenName: string;
      connectedAt: string;
      postsLast24h: number;
      dailyCap: number;
    };

export function ConnectXCard({ returnTo }: { returnTo?: string } = {}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await api.get<Status>('/social/x/status');
      setStatus(s);
    } catch (err) {
      // Treat any error as "not connected" — the user can retry.
      setStatus({ connected: false });
      setError(err instanceof ApiError ? err.message : 'Could not check X status');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pick up the ?x_connected=@handle / ?x_error=... fragments the
  // OAuth callback set on its redirect back, then strip them so a
  // refresh doesn't re-show the toast.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ok = params.get('x_connected');
    const err = params.get('x_error');
    if (ok) {
      setSuccess(`Connected as @${ok}`);
      void refresh();
    }
    if (err) setError(err);
    if (ok || err) {
      params.delete('x_connected');
      params.delete('x_error');
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, [refresh]);

  const handleConnect = useCallback(
    async (opts: { forceLogin?: boolean } = {}) => {
      setBusy(true);
      setError(null);
      try {
        const dest = returnTo ?? '/profile';
        const params = new URLSearchParams({ returnTo: dest });
        if (opts.forceLogin) params.set('forceLogin', '1');
        const { url } = await api.get<{ url: string }>(
          `/social/x/connect-url?${params.toString()}`,
        );
        // Force-login flow: punch the X session first so the user lands
        // on a fresh login screen instead of a one-click "Authorize"
        // for whatever account is currently signed in. We open the
        // logout in the same tab; X redirects to login on its own,
        // and we follow with the OAuth URL once the user is back.
        if (opts.forceLogin) {
          // Best-effort: pop a logout tab in a hidden window. Some
          // browsers block this, so we still set our location to the
          // OAuth URL with force_login=true as the real switch lever.
          try {
            window.open('https://x.com/logout', '_blank', 'noopener');
          } catch {
            /* popup blocked — force_login on the auth URL is enough */
          }
        }
        window.location.href = url;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not start X OAuth');
        setBusy(false);
      }
    },
    [returnTo],
  );

  const handleDisconnect = useCallback(async () => {
    if (!window.confirm('Disconnect your X account from Atlas?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete('/social/x');
      setStatus({ connected: false });
      setSuccess('Disconnected');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect');
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-10 h-10 rounded-lg shrink-0"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Twitter className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-light">X (Twitter)</div>
          <div className="text-[11.5px] text-zinc-500 font-light">
            Let your AI agents post launch announcements and milestones from your account.
          </div>
        </div>

        {status === null ? (
          <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
        ) : status.connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className="text-[12px] font-light px-3 py-1.5 rounded-md transition disabled:opacity-50"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleConnect()}
            disabled={busy}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
            style={{
              background: 'rgba(20,241,149,0.15)',
              color: '#e4d8ff',
              border: '1px solid rgba(20,241,149,0.3)',
            }}
          >
            {busy ? 'Redirecting…' : 'Connect X'}
          </button>
        )}
      </div>

      {/* Account-picker hint. X's OAuth reuses whatever session the
          browser has, so users logged into a brand handle (e.g. an
          ops account) get auto-redirected to authorize THAT account
          with no chooser. The "Switch X account" link punches the
          session first + adds force_login=true so they land on the
          login screen and can pick the right one. */}
      {status?.connected === false && (
        <div className="mt-2 text-[10.5px] text-zinc-500 font-light leading-relaxed">
          Will connect whichever X account you&apos;re currently signed into.{' '}
          <button
            type="button"
            onClick={() => handleConnect({ forceLogin: true })}
            disabled={busy}
            className="underline decoration-zinc-600 underline-offset-2 hover:text-[#b4a7ff] hover:decoration-[#b4a7ff] transition disabled:opacity-50"
          >
            Switch X account
          </button>{' '}
          to log in with a different one.
        </div>
      )}

      {status?.connected && (
        <div className="mt-3 flex items-center gap-3 text-[11.5px] font-mono text-zinc-400">
          <span className="text-emerald-400">●</span>
          <span>
            Posting as <span className="text-white">@{status.screenName}</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            {status.postsLast24h}/{status.dailyCap} posts in 24h
          </span>
        </div>
      )}

      {error && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-[11.5px] flex items-center justify-between"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
          }}
        >
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="ml-2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      )}

      {success && !error && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-[11.5px] flex items-center justify-between"
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            color: '#86efac',
          }}
        >
          <span className="truncate">{success}</span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            aria-label="Dismiss"
            className="ml-2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
