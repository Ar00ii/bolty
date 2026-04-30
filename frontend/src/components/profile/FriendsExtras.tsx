'use client';

import { Check, Loader2, Mail, MailX, UserPlus, UserX, X } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api/client';

/**
 * Friends-tab extras: privacy toggles + suggested users.
 *
 * Two cards, both optional:
 *   1. Privacy   — flip "accept friend requests" / "accept public DMs"
 *      on or off. The toggles persist via PATCH /users/preferences/privacy.
 *   2. Suggested — fetches /users/suggested, shows a small grid of
 *      user cards with an "Add" button that fires the existing
 *      sendFriendRequest endpoint and removes the row optimistically.
 *
 * Designed to sit ABOVE the existing friends list / search panel so
 * we don't have to rewrite that working surface.
 */

interface SuggestedUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  reputationPoints: number;
  userTag: string | null;
}

interface PrivacyState {
  friendRequestsEnabled: boolean;
  publicMessagesEnabled: boolean;
}

export function FriendsExtras({ onFriendRequestSent }: { onFriendRequestSent?: () => void }) {
  // ── Privacy ──────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState<PrivacyState | null>(null);
  const [privacyBusy, setPrivacyBusy] = useState<keyof PrivacyState | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PrivacyState>('/users/preferences/privacy')
      .then(setPrivacy)
      .catch(() => setPrivacy({ friendRequestsEnabled: true, publicMessagesEnabled: true }));
  }, []);

  const togglePrivacy = useCallback(
    async (key: keyof PrivacyState) => {
      if (!privacy) return;
      const next = !privacy[key];
      // Optimistic update so the toggle feels instant.
      setPrivacy({ ...privacy, [key]: next });
      setPrivacyBusy(key);
      setPrivacyError(null);
      try {
        const updated = await api.patch<PrivacyState>('/users/preferences/privacy', {
          [key]: next,
        });
        setPrivacy(updated);
      } catch (err) {
        // Roll back
        setPrivacy({ ...privacy });
        setPrivacyError(err instanceof ApiError ? err.message : 'Could not save preference');
      } finally {
        setPrivacyBusy(null);
      }
    },
    [privacy],
  );

  // ── Suggested users ─────────────────────────────────────────────
  const [suggested, setSuggested] = useState<SuggestedUser[] | null>(null);
  const [busyAddId, setBusyAddId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const loadSuggested = useCallback(async () => {
    try {
      const rows = await api.get<SuggestedUser[]>('/users/suggested?limit=12');
      setSuggested(Array.isArray(rows) ? rows : []);
    } catch {
      setSuggested([]);
    }
  }, []);

  useEffect(() => {
    void loadSuggested();
  }, [loadSuggested]);

  const handleAdd = useCallback(
    async (id: string) => {
      setBusyAddId(id);
      setAddError(null);
      try {
        await api.post('/social/friends/request', { targetId: id });
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        // Tell parent so its existing friend-request counter / list
        // can refresh without us touching that state directly.
        onFriendRequestSent?.();
      } catch (err) {
        setAddError(err instanceof ApiError ? err.message : 'Could not send friend request');
      } finally {
        setBusyAddId(null);
      }
    },
    [onFriendRequestSent],
  );

  return (
    <div className="space-y-4">
      {/* Privacy */}
      <div className="profile-content-card">
        <div className="mb-3">
          <h3 className="text-[14px] text-white font-semibold">Privacy</h3>
          <p className="text-[11.5px] text-zinc-500 mt-0.5">
            Control who can reach out to you on Bolty.
          </p>
        </div>

        {privacyError && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-[11.5px] flex items-center justify-between"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }}
          >
            <span className="truncate">{privacyError}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setPrivacyError(null)}
              className="ml-2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="space-y-2">
          <PrivacyRow
            icon={<UserPlus className="w-4 h-4" strokeWidth={1.75} />}
            title="Accept friend requests"
            subtitle="When off, others see you as not accepting requests."
            value={privacy?.friendRequestsEnabled ?? true}
            busy={privacyBusy === 'friendRequestsEnabled'}
            onChange={() => togglePrivacy('friendRequestsEnabled')}
          />
          <PrivacyRow
            icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
            title="Public messages from non-friends"
            subtitle="When off, only your friends can DM you. Public chat replies still work."
            value={privacy?.publicMessagesEnabled ?? true}
            busy={privacyBusy === 'publicMessagesEnabled'}
            onChange={() => togglePrivacy('publicMessagesEnabled')}
          />
        </div>
      </div>

      {/* Suggested */}
      <div className="profile-content-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] text-white font-semibold">Suggested</h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              People worth meeting on Bolty: top reputation, recently active, fresh joiners.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuggested(null);
              void loadSuggested();
            }}
            className="text-[11px] text-zinc-400 hover:text-white transition"
          >
            Refresh
          </button>
        </div>

        {addError && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-[11.5px]"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }}
          >
            {addError}
          </div>
        )}

        {suggested === null ? (
          <div className="text-[12px] text-zinc-500 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading suggestions…
          </div>
        ) : suggested.length === 0 ? (
          <div className="text-[12px] text-zinc-500 italic">
            No suggestions right now. Check back later as new builders join.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggested.map((u) => {
              const added = addedIds.has(u.id);
              const busy = busyAddId === u.id;
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Link
                    href={u.username ? `/u/${u.username}` : '#'}
                    className="w-9 h-9 rounded-full overflow-hidden grid place-items-center shrink-0"
                    style={{
                      background: 'rgba(20, 241, 149,0.12)',
                      border: '1px solid rgba(20, 241, 149,0.25)',
                    }}
                  >
                    {u.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono text-[#b4a7ff]">
                        {(u.displayName || u.username || '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={u.username ? `/u/${u.username}` : '#'}
                      className="text-[13px] text-white font-semibold truncate hover:text-[#b4a7ff] transition block"
                    >
                      {u.displayName || u.username || 'Anonymous'}
                    </Link>
                    <div className="text-[10.5px] text-zinc-500 font-mono truncate">
                      @{u.username ?? '—'}
                      {u.reputationPoints > 0 && (
                        <>
                          {' · '}
                          {u.reputationPoints.toLocaleString()} rays
                        </>
                      )}
                    </div>
                  </div>
                  {added ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md text-emerald-300"
                      style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.25)',
                      }}
                    >
                      <Check className="w-3 h-3" />
                      Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(u.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition disabled:opacity-50"
                      style={{
                        background: 'rgba(20, 241, 149,0.18)',
                        color: '#e4d8ff',
                        border: '1px solid rgba(20, 241, 149,0.4)',
                      }}
                    >
                      {busy ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Hidden import-keepalive — TS strips imports it thinks are unused */}
      <span className="sr-only">
        <UserX className="w-3 h-3" />
        <MailX className="w-3 h-3" />
      </span>
    </div>
  );
}

function PrivacyRow({
  icon,
  title,
  subtitle,
  value,
  busy,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  busy: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: value ? '#e4e4e7' : '#71717a',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] text-white font-semibold">{title}</div>
        <div className="text-[10.5px] text-zinc-500 font-semibold">{subtitle}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onChange}
        disabled={busy}
        className="relative w-9 h-5 rounded-full transition disabled:opacity-50"
        style={{
          background: value ? '#14F195' : 'rgba(255,255,255,0.08)',
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: value ? '18px' : '2px' }}
        />
      </button>
    </div>
  );
}
