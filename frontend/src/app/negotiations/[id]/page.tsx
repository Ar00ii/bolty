'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { Negotiation, NegotiationMessage } from '@/app/market/agents/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

type Role = NegotiationMessage['fromRole'];

function timeFmt(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function NegotiationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const negotiationId = params?.id ?? null;

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterNote, setCounterNote] = useState<string>('');
  const [actionBusy, setActionBusy] = useState<'accept' | 'reject' | 'counter' | null>(null);
  const [agentTyping, setAgentTyping] = useState<Role | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(`/negotiations/${negotiationId ?? ''}`)}`,
      );
    }
  }, [isAuthenticated, isLoading, router, negotiationId]);

  // Initial fetch
  useEffect(() => {
    if (!isAuthenticated || !negotiationId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get<Negotiation>(`/market/negotiations/${negotiationId}`);
        if (!cancelled) {
          setNegotiation(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, negotiationId]);

  // Socket: join + event wiring
  useEffect(() => {
    if (!isAuthenticated || !negotiationId) return;
    const socket = io(`${WS_URL}/negotiations`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:negotiation', negotiationId);
    });

    socket.on('negotiation:message', (msg: NegotiationMessage) => {
      setNegotiation((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
      setAgentTyping(null);
    });

    socket.on(
      'negotiation:status',
      (data: { status: Negotiation['status']; agreedPrice?: number | null; mode?: Negotiation['mode'] }) => {
        setNegotiation((prev) =>
          prev
            ? {
                ...prev,
                status: data.status ?? prev.status,
                agreedPrice: data.agreedPrice ?? prev.agreedPrice,
                mode: data.mode ?? prev.mode,
              }
            : prev,
        );
      },
    );

    socket.on('negotiation:agent-typing', (data: { role: Role }) => {
      setAgentTyping(data.role);
      // Auto-clear if no follow-up within 5s (belt-and-suspenders —
      // negotiation:message also clears it).
      setTimeout(() => setAgentTyping((cur) => (cur === data.role ? null : cur)), 5000);
    });

    socket.on('negotiation:human-switch-activated', () => {
      setNegotiation((prev) => (prev ? { ...prev, mode: 'HUMAN' } : prev));
    });

    socket.on('negotiation:error', (data: { message?: string }) => {
      setError(data.message ?? 'Negotiation error');
      setTimeout(() => setError(null), 4000);
    });

    return () => {
      socket.emit('leave:negotiation', negotiationId);
      socket.disconnect();
    };
  }, [isAuthenticated, negotiationId]);

  // Smooth scroll to newest message
  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [negotiation?.messages.length]);

  const viewerRole = useMemo<'buyer' | 'seller' | null>(() => {
    if (!negotiation || !user) return null;
    if (user.id === negotiation.buyer.id) return 'buyer';
    if (user.id === negotiation.listing.sellerId) return 'seller';
    return null;
  }, [negotiation, user]);

  const sendPrompt = useCallback(async () => {
    const content = draft.trim();
    if (!content || posting || !negotiation) return;
    setPosting(true);
    try {
      await api.post(`/market/negotiations/${negotiation.id}/message`, { content });
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPosting(false);
    }
  }, [draft, posting, negotiation]);

  const accept = useCallback(async () => {
    if (!negotiation) return;
    setActionBusy('accept');
    try {
      await api.post(`/market/negotiations/${negotiation.id}/accept`, {});
      // Status update will arrive via socket too, but optimistically update.
      setNegotiation((prev) =>
        prev ? { ...prev, status: 'AGREED' } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setActionBusy(null);
    }
  }, [negotiation]);

  const reject = useCallback(async () => {
    if (!negotiation) return;
    setActionBusy('reject');
    try {
      await api.post(`/market/negotiations/${negotiation.id}/reject`, {});
      setNegotiation((prev) =>
        prev ? { ...prev, status: 'REJECTED' } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionBusy(null);
    }
  }, [negotiation]);

  const submitCounter = useCallback(async () => {
    if (!negotiation) return;
    const price = Number(counterPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid counter-offer price');
      setTimeout(() => setError(null), 2500);
      return;
    }
    setActionBusy('counter');
    try {
      await api.post(`/market/negotiations/${negotiation.id}/counter`, {
        content: counterNote.trim() || `Counter-offer at ${price} ${negotiation.listing.currency}`,
        proposedPrice: price,
      });
      setCounterOpen(false);
      setCounterPrice('');
      setCounterNote('');
      setNegotiation((prev) =>
        prev ? { ...prev, status: 'ACTIVE', agreedPrice: null } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Counter-offer failed');
    } finally {
      setActionBusy(null);
    }
  }, [negotiation, counterPrice, counterNote]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070A]">
        <Loader2 className="h-6 w-6 animate-spin text-[#836EF9]" />
      </div>
    );
  }

  if (error && !negotiation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070A] p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-200">{error}</p>
          <Link
            href="/market/agents"
            className="mt-4 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
          >
            <ArrowRight className="h-3 w-3 rotate-180" />
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (!negotiation) return null;

  const { listing, agreedPrice, status, mode, messages } = negotiation;
  const isClosed = status !== 'ACTIVE';
  const canAcceptAsBuyer = viewerRole === 'buyer' && status === 'AGREED';
  const buyerHasAgent = negotiation.buyer.id === user?.id;

  return (
    <div className="mk-app-page relative min-h-[calc(100vh-4rem)] bg-[#07070A] text-white" style={{ maxWidth: 'none', padding: 0 }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1000px 600px at 20% 0%, rgba(131,110,249,0.10), transparent 60%), radial-gradient(800px 500px at 90% 20%, rgba(6,182,212,0.07), transparent 60%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:py-8">
        {/* ── Chat column ─────────────────────────────────────────────── */}
        <section className="flex min-h-0 flex-col">
          <Header listing={listing} status={status} mode={mode} />

          {/* Messages */}
          <div
            className="relative flex-1 overflow-hidden rounded-2xl"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              height: 'min(70vh, 640px)',
            }}
          >
            <div
              ref={feedRef}
              className="h-full overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#836EF9]" />
                  <p className="text-sm text-white/50">Your agent is warming up…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        viewerRole={viewerRole}
                        buyerName={negotiation.buyer.username ?? 'Buyer'}
                        currency={listing.currency}
                      />
                    ))}
                  </AnimatePresence>
                  {agentTyping && <TypingBubble role={agentTyping} />}
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div
            className="mt-3 rounded-2xl p-3"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 px-1 pb-1 text-[10.5px] uppercase tracking-[0.22em] text-white/40">
              <Sparkles className="h-3 w-3 text-[#C9BEFF]" />
              Prompt your agent
              <span className="ml-auto text-[10px] normal-case tracking-normal text-white/30">
                Shift + Enter for newline
              </span>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendPrompt();
                  }
                }}
                placeholder={
                  isClosed
                    ? 'Negotiation is closed.'
                    : buyerHasAgent
                      ? 'Tell your agent what to push for (e.g. "ask about refund policy")…'
                      : 'Tell your seller-side agent how to respond…'
                }
                disabled={isClosed || posting}
                rows={2}
                maxLength={500}
                className="flex-1 resize-none rounded-xl bg-black/40 px-3 py-2 text-sm font-light text-white outline-none ring-1 ring-white/5 transition focus:ring-[#836EF9]/50 disabled:opacity-50"
              />
              <button
                onClick={sendPrompt}
                disabled={!draft.trim() || isClosed || posting}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 text-sm font-normal text-white shadow-[0_0_22px_-8px_#836EF9] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[11px] text-rose-300">{error}</p>
            )}
          </div>
        </section>

        {/* ── Actions rail ───────────────────────────────────────────── */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          <StatusCard
            status={status}
            agreedPrice={agreedPrice ?? null}
            askingPrice={listing.price}
            currency={listing.currency}
            turns={messages.length}
          />

          <ActionsCard
            status={status}
            canAcceptAsBuyer={canAcceptAsBuyer}
            busy={actionBusy}
            onAccept={accept}
            onReject={reject}
            onCounter={() => setCounterOpen(true)}
          />

          <ListingCard
            title={listing.title}
            price={listing.price}
            currency={listing.currency}
            listingId={listing.id}
          />
        </aside>
      </div>

      {/* Counter-offer modal */}
      <AnimatePresence>
        {counterOpen && (
          <CounterModal
            askingPrice={listing.price}
            currency={listing.currency}
            price={counterPrice}
            setPrice={setCounterPrice}
            note={counterNote}
            setNote={setCounterNote}
            busy={actionBusy === 'counter'}
            onSubmit={submitCounter}
            onClose={() => setCounterOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  listing,
  status,
  mode,
}: {
  listing: Negotiation['listing'];
  status: Negotiation['status'];
  mode: Negotiation['mode'];
}) {
  const statusColor: Record<Negotiation['status'], string> = {
    ACTIVE: '#836EF9',
    AGREED: '#4ADE80',
    REJECTED: '#FB7185',
    EXPIRED: '#A1A1AA',
  };
  return (
    <div className="mb-3 flex items-center gap-3">
      <Link
        href={`/market/agents/${listing.id}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:brightness-125"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.22), rgba(6,182,212,0.12))',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
        }}
      >
        <Bot className="h-5 w-5 text-[#C9BEFF]" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
          Negotiation
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[10px]"
            style={{
              background: `${statusColor[status]}22`,
              color: statusColor[status],
            }}
          >
            <span
              className={`h-1 w-1 rounded-full ${status === 'ACTIVE' ? 'animate-pulse' : ''}`}
              style={{ background: statusColor[status] }}
            />
            {status.toLowerCase()}
          </span>
          <span className="hidden rounded-full bg-white/5 px-2 py-[1px] text-white/50 sm:inline">
            {mode === 'AI_AI' ? 'AI ↔ AI' : 'Human mode'}
          </span>
        </div>
        <h1 className="mt-0.5 truncate text-lg font-light tracking-tight">
          {listing.title}
        </h1>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  viewerRole,
  buyerName,
  currency,
}: {
  message: NegotiationMessage;
  viewerRole: 'buyer' | 'seller' | null;
  buyerName: string;
  currency: string;
}) {
  const isBuyerSide =
    message.fromRole === 'buyer' || message.fromRole === 'buyer_agent';
  const isAgent =
    message.fromRole === 'buyer_agent' || message.fromRole === 'seller_agent';
  // Align viewer's side to the right, the other side to the left.
  const alignRight = viewerRole === 'buyer' ? isBuyerSide : !isBuyerSide;

  const label =
    message.fromRole === 'buyer'
      ? buyerName
      : message.fromRole === 'seller'
        ? 'Seller'
        : message.fromRole === 'buyer_agent'
          ? "Buyer's agent"
          : "Seller's agent";

  const accent = isBuyerSide ? '#836EF9' : '#06B6D4';
  const bg = isBuyerSide
    ? 'rgba(131,110,249,0.10)'
    : 'rgba(6,182,212,0.08)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[80%] items-start gap-2 ${
          alignRight ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `${accent}22`,
            boxShadow: `inset 0 0 0 1px ${accent}44`,
          }}
        >
          {isAgent ? (
            <Bot className="h-3.5 w-3.5" style={{ color: accent }} />
          ) : (
            <User className="h-3.5 w-3.5" style={{ color: accent }} />
          )}
        </div>
        <div className="min-w-0">
          <div
            className={`flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-white/40 ${
              alignRight ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <span style={{ color: accent }}>{label}</span>
            <span>·</span>
            <span className="text-white/30">{timeFmt(message.createdAt)}</span>
          </div>
          <div
            className="mt-1 rounded-2xl px-3 py-2 text-sm font-light text-white/95"
            style={{
              background: bg,
              boxShadow: `inset 0 0 0 1px ${accent}22`,
            }}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.proposedPrice != null && (
              <div
                className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-[1px] text-[10.5px] font-normal tabular-nums ${
                  alignRight ? 'float-right' : ''
                }`}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: accent,
                }}
              >
                proposes {message.proposedPrice} {currency}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TypingBubble({ role }: { role: Role }) {
  const isBuyerSide = role === 'buyer' || role === 'buyer_agent';
  const accent = isBuyerSide ? '#836EF9' : '#06B6D4';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex ${isBuyerSide ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{
          background: `${accent}15`,
          boxShadow: `inset 0 0 0 1px ${accent}30`,
        }}
      >
        <Bot className="h-3 w-3" style={{ color: accent }} />
        <span className="text-[11px] text-white/60">typing</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full"
              style={{ background: accent }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

function StatusCard({
  status,
  agreedPrice,
  askingPrice,
  currency,
  turns,
}: {
  status: Negotiation['status'];
  agreedPrice: number | null;
  askingPrice: number;
  currency: string;
  turns: number;
}) {
  const label = {
    ACTIVE: 'Negotiating…',
    AGREED: 'Deal reached',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
  }[status];
  const agreedColor =
    status === 'AGREED' ? '#4ADE80' : status === 'REJECTED' ? '#FB7185' : '#836EF9';
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
        Status
      </div>
      <div className="mt-1 text-lg font-light tracking-tight" style={{ color: agreedColor }}>
        {label}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          Asking
        </div>
        <div className="text-sm tabular-nums text-white/70">
          {askingPrice} {currency}
        </div>
      </div>
      {agreedPrice != null && (
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/70">
            Agreed
          </div>
          <div className="text-lg font-normal tabular-nums text-emerald-300">
            {agreedPrice} {currency}
          </div>
        </div>
      )}
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-[2px] text-[10.5px] text-white/50">
        <MessageSquare className="h-3 w-3" />
        {turns} messages
      </div>
    </div>
  );
}

function ActionsCard({
  status,
  canAcceptAsBuyer,
  busy,
  onAccept,
  onReject,
  onCounter,
}: {
  status: Negotiation['status'];
  canAcceptAsBuyer: boolean;
  busy: 'accept' | 'reject' | 'counter' | null;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
}) {
  if (status === 'REJECTED' || status === 'EXPIRED') {
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-sm font-light text-white/60">
          This negotiation is over.
        </p>
      </div>
    );
  }
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl p-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
        Deal actions
      </div>
      {canAcceptAsBuyer ? (
        <button
          onClick={onAccept}
          disabled={busy === 'accept'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-sm font-normal text-white shadow-[0_0_22px_-6px_#10b981] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy === 'accept' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Accept deal
        </button>
      ) : (
        <p className="text-[11px] text-white/50">
          {status === 'ACTIVE'
            ? 'Waiting for your agents to reach a deal — prompts above nudge yours in real time.'
            : 'Waiting for the buyer to accept, counter, or walk.'}
        </p>
      )}
      <button
        onClick={onCounter}
        disabled={busy !== null}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#836EF9]/40 bg-[#836EF9]/10 px-3 py-2 text-sm font-normal text-white transition hover:bg-[#836EF9]/20 disabled:opacity-40"
      >
        {busy === 'counter' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        Counter-offer
      </button>
      <button
        onClick={onReject}
        disabled={busy !== null}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-light text-white/70 transition hover:border-rose-500/40 hover:text-rose-200 disabled:opacity-40"
      >
        {busy === 'reject' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        Walk away
      </button>
    </div>
  );
}

function ListingCard({
  title,
  price,
  currency,
  listingId,
}: {
  title: string;
  price: number;
  currency: string;
  listingId: string;
}) {
  return (
    <Link
      href={`/market/agents/${listingId}`}
      className="group block rounded-2xl p-4 transition hover:bg-white/[0.02]"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
        Listing
      </div>
      <div className="mt-1 truncate text-sm font-normal text-white">{title}</div>
      <div className="mt-1 text-[11px] text-white/50">
        Asking{' '}
        <span className="tabular-nums text-white/80">
          {price} {currency}
        </span>
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/45 transition group-hover:text-white">
        View agent
        <ExternalLink className="h-3 w-3" />
      </div>
    </Link>
  );
}

function CounterModal({
  askingPrice,
  currency,
  price,
  setPrice,
  note,
  setNote,
  busy,
  onSubmit,
  onClose,
}: {
  askingPrice: number;
  currency: string;
  price: string;
  setPrice: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(28,26,38,0.95) 0%, rgba(10,10,14,0.95) 100%)',
          boxShadow:
            '0 0 0 1px rgba(131,110,249,0.25), 0 30px 60px -20px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#C9BEFF]" />
            <h3 className="text-sm font-normal">Counter-offer</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-white/40">
              New price ({currency})
            </label>
            <input
              inputMode="decimal"
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/,/g, '.'))}
              placeholder={`${(askingPrice * 0.8).toFixed(2)}`}
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm font-light text-white outline-none ring-1 ring-white/5 focus:ring-[#836EF9]/50"
            />
            <p className="mt-1 text-[10.5px] text-white/40">
              Asking is {askingPrice} {currency}. The negotiation re-opens at
              this price.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-white/40">
              Note for the seller (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 240))}
              placeholder={`"Adds value after a 2-week free trial — going ${(askingPrice * 0.8).toFixed(2)} max."`}
              rows={3}
              className="w-full resize-none rounded-xl bg-black/40 px-3 py-2 text-sm font-light text-white outline-none ring-1 ring-white/5 focus:ring-[#836EF9]/50"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-xs text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={busy || !price.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 py-2 text-sm font-normal text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send counter-offer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
