'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Hash,
  Heart,
  ImagePlus,
  Loader2,
  MessageSquare,
  Send,
  Smile,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { GradientText } from '@/components/ui/GradientText';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, API_URL, WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface FeedMessage {
  id: string;
  content: string;
  channel: string;
  imageUrl: string | null;
  viaAgentListingId?: string | null;
  viaAgentName?: string | null;
  likeCount: number;
  likedByMe?: boolean;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  reputationPoints?: number;
  createdAt: string;
}

interface AgentListing {
  id: string;
  title: string;
  status: string;
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
  // Keep a per-channel cache so switching is instant — we show cached
  // posts immediately and revalidate in the background.
  const [messagesByChannel, setMessagesByChannel] = useState<
    Record<string, FeedMessage[]>
  >({});
  const [channelLoading, setChannelLoading] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const [pendingImage, setPendingImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myAgents, setMyAgents] = useState<AgentListing[]>([]);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentListing | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef(channel);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the live-channel read by the socket handler fresh without
  // tearing down the connection on every switch.
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent('/feed')}`);
    }
  }, [isAuthenticated, isLoading, router]);

  // Load agents once the user is authed — needed for the composer's
  // "Connect an agent" picker.
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const rows = await api.get<AgentListing[]>('/chat/my-agents');
        setMyAgents(rows);
      } catch {
        /* no-op */
      }
    })();
  }, [isAuthenticated]);

  // Fetch the current channel's timeline. Serve cached first, then
  // revalidate in the background.
  const loadChannel = useCallback(
    async (ch: string) => {
      setChannelLoading((prev) => ({ ...prev, [ch]: true }));
      try {
        const data = await api.get<FeedMessage[]>(
          `/chat/messages?limit=50&channel=${encodeURIComponent(ch)}`,
        );
        setMessagesByChannel((prev) => ({ ...prev, [ch]: data }));
      } catch {
        setMessagesByChannel((prev) => ({ ...prev, [ch]: prev[ch] ?? [] }));
      } finally {
        setChannelLoading((prev) => ({ ...prev, [ch]: false }));
      }
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadChannel(channel);
  }, [channel, isAuthenticated, loadChannel]);

  // Connect ONCE to the socket. Channel-awareness reads channelRef so
  // switching channels no longer tears down the socket.
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
      setMessagesByChannel((prev) => {
        const list = prev[msg.channel] ?? [];
        if (list.some((m) => m.id === msg.id)) return prev;
        const next = [{ ...msg, likedByMe: false }, ...list].slice(0, 200);
        return { ...prev, [msg.channel]: next };
      });
    });

    socket.on(
      'likeUpdate',
      (payload: { messageId: string; likeCount: number; likedBy: string; liked: boolean }) => {
        setMessagesByChannel((prev) => {
          const out: Record<string, FeedMessage[]> = {};
          for (const [ch, list] of Object.entries(prev)) {
            out[ch] = list.map((m) =>
              m.id === payload.messageId
                ? {
                    ...m,
                    likeCount: payload.likeCount,
                    likedByMe:
                      payload.likedBy === user?.id ? payload.liked : m.likedByMe,
                  }
                : m,
            );
          }
          return out;
        });
      },
    );

    socket.on('error', (err: { message: string }) => {
      setNotice(err.message);
      setTimeout(() => setNotice(''), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const messages = messagesByChannel[channel] ?? [];
  const loading = channelLoading[channel] ?? !messagesByChannel[channel];

  const sendPost = useCallback(() => {
    const content = input.trim();
    if (!content && !pendingImage) return;
    if (!socketRef.current || !connected) {
      setNotice('Still connecting… try again in a moment.');
      setTimeout(() => setNotice(''), 2500);
      return;
    }
    socketRef.current.emit('sendMessage', {
      content: content || (pendingImage ? '📎 shared an image' : ''),
      channel,
      imageUrl: pendingImage?.url ?? null,
      viaAgentListingId: activeAgent?.id ?? null,
    });
    setInput('');
    setPendingImage(null);
    setShowEmoji(false);
  }, [input, connected, channel, pendingImage, activeAgent]);

  const toggleLike = (messageId: string) => {
    if (!socketRef.current) return;
    setMessagesByChannel((prev) => {
      const out: Record<string, FeedMessage[]> = {};
      for (const [ch, list] of Object.entries(prev)) {
        out[ch] = list.map((m) =>
          m.id === messageId
            ? {
                ...m,
                likedByMe: !m.likedByMe,
                likeCount: m.likeCount + (m.likedByMe ? -1 : 1),
              }
            : m,
        );
      }
      return out;
    });
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

  const onFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Only image files are allowed.');
      setTimeout(() => setNotice(''), 2500);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Images must be under 5MB.');
      setTimeout(() => setNotice(''), 2500);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.upload<{ url: string; fileName: string }>(
        '/chat/upload-image',
        form,
      );
      // The server returns a relative path under /chat/images — prefix
      // with the API origin so <img> resolves against the backend.
      const origin = new URL(API_URL).origin;
      setPendingImage({
        url: res.url.startsWith('http') ? res.url : `${origin}${res.url}`,
        name: res.fileName,
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Upload failed.');
      setTimeout(() => setNotice(''), 2500);
    } finally {
      setUploading(false);
    }
  }, []);

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
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#07070A] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1000px 600px at 20% 0%, rgba(131,110,249,0.10), transparent 60%), radial-gradient(800px 500px at 90% 20%, rgba(6,182,212,0.07), transparent 60%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr_300px] lg:py-8">
        {/* ── Channels rail ─────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div
            className="relative overflow-hidden rounded-2xl p-3 font-light"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                Channels
              </h2>
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_6px_#4ADE80]' : 'bg-white/20'}`}
                />
                {connected ? 'Live' : 'Off'}
              </span>
            </div>
            <nav className="flex flex-col gap-0.5">
              {CHANNELS.map((c) => {
                const active = c.id === channel;
                return (
                  <button
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/70 hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${c.accent}30, transparent)`
                          : 'rgba(255,255,255,0.03)',
                        boxShadow: active ? `inset 0 0 0 1px ${c.accent}40` : 'none',
                      }}
                    >
                      <Hash
                        className="h-3.5 w-3.5"
                        style={{ color: active ? c.accent : 'rgba(255,255,255,0.5)' }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-normal">{c.label}</div>
                      <div className="truncate text-[10.5px] text-white/35">
                        {c.tagline}
                      </div>
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

            <div className="mt-3 flex items-center justify-between border-t border-white/5 px-2 pt-3 text-[11px] text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span className="font-normal text-white/75">{userCount}</span>
                <span>online</span>
              </span>
              <Link
                href="/bolty"
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Zap className="h-3 w-3 text-[#C9BEFF]" />
                $BOLTY
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Timeline + composer ───────────────────────────────────────── */}
        <section className="flex min-h-0 flex-col">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${activeChannel.accent}22, transparent)`,
                boxShadow: `inset 0 0 0 1px ${activeChannel.accent}33`,
              }}
            >
              <Hash className="h-4 w-4" style={{ color: activeChannel.accent }} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-light tracking-tight">
                <GradientText gradient="purple">#{activeChannel.label.toLowerCase()}</GradientText>
              </h1>
              <p className="truncate text-xs text-white/50">{activeChannel.tagline}</p>
            </div>
          </div>

          {/* Composer */}
          <div
            className="relative mb-4 overflow-hidden rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {/* Active agent chip */}
            {activeAgent && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#836EF9]/35 bg-[#836EF9]/10 px-2.5 py-1 text-[11px] text-white/90">
                <Bot className="h-3 w-3 text-[#C9BEFF]" />
                <span className="uppercase tracking-[0.14em] text-white/50">Via</span>
                <span className="font-medium">{activeAgent.title}</span>
                <button
                  onClick={() => setActiveAgent(null)}
                  className="ml-1 text-white/50 hover:text-white"
                  aria-label="Disconnect agent"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <UserAvatar
                src={user?.avatarUrl}
                name={user?.username ?? null}
                userId={user?.id}
                size={40}
              />
              <div className="min-w-0 flex-1">
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
                  placeholder={
                    activeAgent
                      ? `Post as ${activeAgent.title} to #${activeChannel.label.toLowerCase()}…`
                      : `Post to #${activeChannel.label.toLowerCase()}…`
                  }
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm font-light text-white outline-none placeholder:text-white/30"
                  maxLength={MAX_LEN}
                />

                {/* Pending image preview */}
                {pendingImage && (
                  <div className="relative mt-2 inline-block rounded-xl border border-white/10 bg-black/40 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImage.url}
                      alt={pendingImage.name}
                      className="max-h-40 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white/80 transition hover:bg-black hover:text-white"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/5 hover:text-white"
                    aria-label="Emoji"
                    title="Emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    aria-label="Attach image"
                    title="Attach image"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={onFilePicked}
                  />
                  <button
                    type="button"
                    onClick={() => setAgentPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-white/60 transition hover:bg-white/5 hover:text-white"
                    title="Connect an agent"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    {activeAgent ? 'Change agent' : 'Connect an agent'}
                  </button>
                  <span className="ml-2 text-[11px] text-white/40">
                    {input.length}/{MAX_LEN}
                  </span>
                  <button
                    onClick={sendPost}
                    disabled={(!input.trim() && !pendingImage) || !connected}
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

          {/* Timeline — newest first */}
          <div className="flex flex-col gap-3 pb-8">
            {loading && messages.length === 0 ? (
              <LoadingSkeletons />
            ) : messages.length === 0 ? (
              <EmptyTimeline channel={activeChannel.label} />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.article
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group relative rounded-2xl p-4 transition hover:bg-white/[0.02]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,20,26,0.5) 0%, rgba(10,10,14,0.5) 100%)',
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
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Link
                            href={`/u/${m.username ?? m.userId}`}
                            className="truncate font-normal text-white hover:underline"
                          >
                            {m.username || 'anon'}
                          </Link>
                          {m.viaAgentName && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#836EF9]/30 bg-[#836EF9]/10 px-1.5 py-[1px] text-[10px] text-[#C9BEFF]">
                              <Bot className="h-2.5 w-2.5" />
                              via {m.viaAgentName}
                            </span>
                          )}
                          <span className="shrink-0 text-xs text-white/30">·</span>
                          <span className="shrink-0 text-xs text-white/40">
                            {timeFormatter.format(new Date(m.createdAt))}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm font-light text-white/90">
                          {m.content}
                        </p>
                        {m.imageUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-white/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.imageUrl}
                              alt="attached"
                              className="max-h-96 w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
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
            <h3 className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
              <Sparkles className="h-3 w-3" />
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
                <Link href="/bolty" className="block hover:text-white">
                  <span className="text-[11px] text-white/40">#bolty</span>
                  <div className="font-normal">$BOLTY token + chart</div>
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

            <div className="mt-4 border-t border-white/5 pt-3 text-[11px] text-white/45">
              Posts sync live across every channel.
            </div>
          </div>
        </aside>
      </div>

      {/* Agent picker modal */}
      <AnimatePresence>
        {agentPickerOpen && (
          <AgentPicker
            agents={myAgents}
            onPick={(a) => {
              setActiveAgent(a);
              setAgentPickerOpen(false);
            }}
            onDisconnect={() => {
              setActiveAgent(null);
              setAgentPickerOpen(false);
            }}
            onClose={() => setAgentPickerOpen(false)}
            active={activeAgent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,26,0.4) 0%, rgba(10,10,14,0.4) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
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

function AgentPicker({
  agents,
  active,
  onPick,
  onDisconnect,
  onClose,
}: {
  agents: AgentListing[];
  active: AgentListing | null;
  onPick: (a: AgentListing) => void;
  onDisconnect: () => void;
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
            <Bot className="h-4 w-4 text-[#C9BEFF]" />
            <h3 className="text-sm font-normal">Connect an agent</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {agents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-light text-white/60">
                You don&apos;t have any AI agent listings yet.
              </p>
              <Link
                href="/market/seller/publish"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 py-2 text-xs font-normal text-white transition hover:brightness-110"
                onClick={onClose}
              >
                Publish an agent
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {agents.map((a) => {
                const isActive = active?.id === a.id;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => onPick(a)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'bg-[#836EF9]/15 text-white'
                          : 'text-white/80 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(131,110,249,0.18), rgba(6,182,212,0.12))',
                          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
                        }}
                      >
                        <Bot className="h-4 w-4 text-[#C9BEFF]" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-normal">
                        {a.title}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase tracking-wider text-[#C9BEFF]">
                          Active
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {active && (
          <div className="border-t border-white/5 p-3">
            <button
              onClick={onDisconnect}
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-normal text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Disconnect agent
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
