'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Hash, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, WS_URL } from '@/lib/api/client';

/**
 * Compact community strip shown on /market — surfaces the 3 newest
 * #marketplace feed posts with a live pulse and a CTA linking to /feed.
 * Pulls its own data so each consumer page can drop it in without
 * plumbing props through their own state trees.
 */

interface FeedMessage {
  id: string;
  content: string;
  channel: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

const CHANNEL = 'marketplace';
const MAX_VISIBLE = 3;

export function CommunityFeedStrip({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<FeedMessage[]>(
          `/chat/messages?limit=10&channel=${CHANNEL}`,
        );
        if (!cancelled) setMessages(data.slice(-MAX_VISIBLE));
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = io(`${WS_URL}/chat`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('newMessage', (msg: FeedMessage) => {
      if (msg.channel !== CHANNEL) return;
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.slice(-MAX_VISIBLE);
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const relative = useMemo(
    () =>
      (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const s = Math.max(0, Math.floor(diff / 1000));
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        if (s < 86400) return `${Math.floor(s / 3600)}h`;
        return `${Math.floor(s / 86400)}d`;
      },
    [],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-4 py-3 ${className}`}
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Hash className="h-3.5 w-3.5 text-[#06B6D4]" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-white/50">
            marketplace
          </span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? 'bg-emerald-400' : 'bg-white/20'
            }`}
            title={connected ? 'Live' : 'Disconnected'}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <MessageSquare className="h-3.5 w-3.5" />
              Community is quiet — be the first to post.
            </div>
          ) : (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {messages.map((m) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-w-0 items-center gap-2"
                >
                  <UserAvatar
                    src={m.avatarUrl}
                    name={m.username}
                    userId={m.userId}
                    size={18}
                  />
                  <span className="shrink-0 text-white/80">
                    {m.username || 'anon'}
                  </span>
                  <span className="truncate text-white/50">{m.content}</span>
                  <span className="shrink-0 text-[10px] text-white/30">
                    {relative(m.createdAt)}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/feed"
          className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-normal text-white/80 transition hover:border-[#836EF9]/40 hover:bg-[#836EF9]/10 hover:text-white"
        >
          Open feed
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export default CommunityFeedStrip;
