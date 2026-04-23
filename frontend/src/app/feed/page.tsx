'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Hash,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Send,
  Smile,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { GradientText } from '@/components/ui/GradientText';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface FeedMessage {
  id: string;
  content: string;
  channel: string;
  imageUrl: string | null;
  likeCount: number;
  likedByMe?: boolean;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  reputationPoints?: number;
  createdAt: string;
}

const CHANNELS: Array<{
  id: string;
  label: string;
  tagline: string;
  accent: string;
}> = [
  { id: 'general', label: 'General', tagline: 'The whole community', accent: '#836EF9' },
  { id: 'marketplace', label: 'Marketplace', tagline: 'Deals, drops, reviews', accent: '#06B6D4' },
  { id: 'agents', label: 'Agents', tagline: 'Show off your bots', accent: '#EC4899' },
  { id: 'dev', label: 'Dev', tagline: 'Repos, code, builds', accent: '#10B981' },
  { id: 'random', label: 'Random', tagline: 'Memes & off-topic', accent: '#F59E0B' },
];

const QUICK_EMOJIS = [
  '🔥', '⚡', '🚀', '💎', '🤖', '👀', '🫡', '❤️', '😂', '🙏', '💯', '👏',
];

const MAX_LEN = 500;

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [channel, setChannel] = useState<string>('general');
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [notice, setNotice] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Redirect unauthenticated users straight to login — pattern used across
  // gated pages to avoid a "not found" dead-end.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent('/feed')}`);
    }
  }, [isAuthenticated, isLoading, router]);

  // Load the timeline for the active channel whenever it changes. The socket
  // still streams live posts for every channel — we filter client-side.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<FeedMessage[]>(
          `/chat/messages?limit=50&channel=${encodeURIComponent(channel)}`,
        );
        if (!cancelled) setMessages(data);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channel, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(`${WS_URL}/chat`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('userCount', (c: number) => setUserCount(c));

    socket.on('newMessage', (msg: FeedMessage) => {
      setMessages((prev) => {
        if (msg.channel !== channel) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, { ...msg, likedByMe: false }];
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    });

    socket.on(
      'likeUpdate',
      (payload: { messageId: string; likeCount: number; likedBy: string; liked: boolean }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  likeCount: payload.likeCount,
                  likedByMe:
                    payload.likedBy === user?.id ? payload.liked : m.likedByMe,
                }
              : m,
          ),
        );
      },
    );

    socket.on('error', (err: { message: string }) => {
      setNotice(err.message);
      setTimeout(() => setNotice(''), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, channel, user?.id]);

  // Auto-scroll to newest post on new arrivals
  useEffect(() => {
    timelineRef.current?.scrollTo({
      top: timelineRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length]);

  const sendPost = useCallback(() => {
    const content = input.trim();
    if (!content || !socketRef.current || !connected) return;
    socketRef.current.emit('sendMessage', { content, channel });
    setInput('');
    setShowEmoji(false);
  }, [input, connected, channel]);

  const toggleLike = (messageId: string) => {
    if (!socketRef.current) return;
    // Optimistic — roll back if the server broadcast says otherwise.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              likedByMe: !m.likedByMe,
              likeCount: m.likeCount + (m.likedByMe ? -1 : 1),
            }
          : m,
      ),
    );
    socketRef.current.emit('toggleLike', { messageId });
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInput((p) => p + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.selectionStart = start + emoji.length;
      el.selectionEnd = start + emoji.length;
      el.focus();
    });
  };

  const activeChannel = useMemo(
    () => CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0],
    [channel],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-5 w-5 animate-spin text-[#836EF9]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-black text-white">
      {/* Ambient glow — matches landing page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1000px 600px at 20% 0%, rgba(131,110,249,0.12), transparent 60%), radial-gradient(800px 500px at 90% 20%, rgba(6,182,212,0.08), transparent 60%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr_280px] lg:py-10">
        {/* ── Channels rail ─────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div
            className="relative overflow-hidden rounded-2xl p-4 font-light"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2"
              style={{ borderColor: 'rgba(131,110,249,0.35)' }}
            />
            <h2 className="px-1 pb-3 text-[11px] uppercase tracking-[0.25em] text-white/40">
              Channels
            </h2>
            <nav className="flex flex-col gap-1">
              {CHANNELS.map((c) => {
                const active = c.id === channel;
                return (
                  <button
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Hash
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? c.accent : 'rgba(255,255,255,0.5)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-normal">{c.label}</div>
                      <div className="truncate text-[11px] text-white/40">{c.tagline}</div>
                    </div>
                    {active && (
                      <motion.span
                        layoutId="feed-channel-dot"
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: c.accent, boxShadow: `0 0 8px ${c.accent}` }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-4 text-xs text-white/50">
              <Users className="h-3.5 w-3.5" />
              <span>
                <span className="font-normal text-white/80">{userCount}</span> online now
              </span>
              <span
                className={`ml-auto h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-white/20'}`}
                title={connected ? 'Live' : 'Disconnected'}
              />
            </div>
          </div>
        </aside>

        {/* ── Timeline + composer ───────────────────────────────────────── */}
        <section className="flex min-h-0 flex-col">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3 px-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${activeChannel.accent}22, transparent)`,
                boxShadow: `inset 0 0 0 1px ${activeChannel.accent}33`,
              }}
            >
              <Hash className="h-5 w-5" style={{ color: activeChannel.accent }} />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                <GradientText gradient="purple">#{activeChannel.label.toLowerCase()}</GradientText>
              </h1>
              <p className="text-xs text-white/50">{activeChannel.tagline}</p>
            </div>
          </div>

          {/* Composer */}
          <div
            className="relative mb-4 overflow-hidden rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2"
              style={{ borderColor: 'rgba(131,110,249,0.35)' }}
            />
            <div className="flex gap-3">
              <UserAvatar src={user?.avatarUrl} name={user?.username ?? null} userId={user?.id} size={40} />
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendPost();
                    }
                  }}
                  placeholder={`Post to #${activeChannel.label.toLowerCase()}…`}
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm font-light text-white outline-none placeholder:text-white/30"
                  maxLength={MAX_LEN}
                />
                <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/5 hover:text-white"
                    aria-label="Emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Image uploads — coming soon"
                    className="rounded-lg p-1.5 text-white/20"
                    aria-label="Image (soon)"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <span className="ml-2 text-[11px] text-white/40">
                    {input.length}/{MAX_LEN}
                  </span>
                  <button
                    onClick={sendPost}
                    disabled={!input.trim() || !connected}
                    className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 py-1.5 text-xs font-normal text-white shadow-[0_0_24px_-6px_#836EF9] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Post
                  </button>
                </div>

                {showEmoji && (
                  <div className="mt-2 flex flex-wrap gap-1 rounded-xl bg-white/[0.04] p-2">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => insertEmoji(e)}
                        className="rounded-md p-1 text-lg transition hover:scale-110 hover:bg-white/5"
                      >
                        {e}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowEmoji(false)}
                      className="ml-auto rounded-md p-1 text-white/40 hover:text-white"
                      aria-label="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {notice && (
            <div className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {notice}
            </div>
          )}

          {/* Timeline */}
          <div
            ref={timelineRef}
            className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-4"
            style={{ maxHeight: 'calc(100vh - 18rem)' }}
          >
            {messages.length === 0 ? (
              <EmptyTimeline channel={activeChannel.label} />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.article
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group relative rounded-2xl p-4 transition hover:bg-white/[0.02]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,20,26,0.4) 0%, rgba(10,10,14,0.4) 100%)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex gap-3">
                      <Link href={`/u/${m.username ?? m.userId}`} className="shrink-0">
                        <UserAvatar
                          src={m.avatarUrl}
                          name={m.username}
                          userId={m.userId}
                          size={40}
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Link
                            href={`/u/${m.username ?? m.userId}`}
                            className="truncate font-normal text-white hover:underline"
                          >
                            {m.username || 'anon'}
                          </Link>
                          <span className="shrink-0 text-xs text-white/30">·</span>
                          <span className="shrink-0 text-xs text-white/40">
                            {timeFormatter.format(new Date(m.createdAt))}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm font-light text-white/90">
                          {m.content}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                          <button
                            onClick={() => toggleLike(m.id)}
                            className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-rose-500/10 hover:text-rose-300 ${
                              m.likedByMe ? 'text-rose-400' : ''
                            }`}
                          >
                            <Heart
                              className="h-3.5 w-3.5"
                              fill={m.likedByMe ? 'currentColor' : 'none'}
                            />
                            {m.likeCount > 0 && <span>{m.likeCount}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* ── Right rail ────────────────────────────────────────────────── */}
        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <div
            className="relative overflow-hidden rounded-2xl p-4 font-light"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-b-2 border-r-2"
              style={{ borderColor: 'rgba(131,110,249,0.35)' }}
            />
            <h3 className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/40">
              <TrendingUp className="h-3.5 w-3.5" />
              What&apos;s happening
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <Link href="/market" className="block hover:text-white">
                  <span className="text-[11px] text-white/40">#marketplace</span>
                  <div className="font-normal">Browse live agents</div>
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="block hover:text-white">
                  <span className="text-[11px] text-white/40">#inventory</span>
                  <div className="font-normal">Your purchases</div>
                </Link>
              </li>
              <li>
                <Link href="/reputation/leaderboard" className="block hover:text-white">
                  <span className="text-[11px] text-white/40">#reputation</span>
                  <div className="font-normal">Top ranked users</div>
                </Link>
              </li>
            </ul>

            <div className="mt-5 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Sparkles className="h-3.5 w-3.5 text-[#836EF9]" />
                <span>Posts sync live across every channel.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyTimeline({ channel }: { channel: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-12 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #836EF922, transparent)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
        }}
      >
        <MessageSquare className="h-5 w-5 text-[#836EF9]" />
      </div>
      <h3 className="text-base font-light">#{channel.toLowerCase()} is quiet</h3>
      <p className="text-sm font-light text-white/50">
        Be the first to post and start the conversation.
      </p>
    </div>
  );
}
