'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string | null;
  senderAvatar: string | null;
  createdAt: string;
  isRead: boolean;
}

interface Contact {
  user: { id: string; username: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastAt: string;
  unread: number;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

function Avatar({ name, url, size = 8 }: { name?: string | null; url?: string | null; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (url) return <img src={url} alt={name || ''} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full flex-shrink-0 flex items-center justify-center text-monad-400 font-semibold text-xs`}
      style={{ background: 'var(--brand-dim, rgba(131,110,249,0.12))', border: '1px solid rgba(131,110,249,0.2)' }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

type ContactCategory = 'all' | 'friends' | 'sellers' | 'vendors';

export default function DmPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activePeer, setActivePeer] = useState<Contact['user'] | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showNewDm, setShowNewDm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ContactCategory>('all');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const CATEGORIES: { id: ContactCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'friends', label: 'Friends' },
    { id: 'sellers', label: 'Sellers' },
    { id: 'vendors', label: 'Vendors' },
  ];

  // For now all contacts fall under "all"; future: filter by user role tag
  const filteredContacts = activeCategory === 'all' ? contacts : [];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(`${WS_URL}/dm`, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('contacts', (data: Contact[]) => setContacts(data));
    socket.on('conversation', ({ peerId, messages: msgs }: { peerId: string; messages: DMMessage[] }) => {
      if (activePeer?.id === peerId || msgs.length > 0) setMessages(msgs);
    });
    socket.on('newDM', ({ peerId, message }: { peerId: string; message: DMMessage }) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        if (activePeer?.id === peerId || message.senderId === user?.id) return [...prev, message];
        return prev;
      });
      setContacts(prev => prev.map(c => {
        if (c.user.id !== peerId) return c;
        const isActive = activePeer?.id === peerId;
        return {
          ...c,
          lastMessage: message.content.slice(0, 60),
          lastAt: message.createdAt,
          unread: isActive ? c.unread : c.unread + (message.senderId !== user?.id ? 1 : 0),
        };
      }));
    });
    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openConversation = useCallback((contact: Contact) => {
    setActivePeer(contact.user);
    setMessages([]);
    socketRef.current?.emit('openConversation', { peerId: contact.user.id });
    setContacts(prev => prev.map(c => c.user.id === contact.user.id ? { ...c, unread: 0 } : c));
  }, []);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !activePeer || !connected) return;
    socketRef.current?.emit('sendDM', { receiverId: activePeer.id, content });
    setInput('');
  }, [input, activePeer, connected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startNewDm = async () => {
    const input = newRecipient.trim().replace(/^@/, '');
    if (!input) return;

    // If it looks like a UUID use it directly, otherwise resolve username → id
    const isUuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(input);
    let peerId = input;
    let peerUsername: string | null = input;
    let peerAvatar: string | null = null;

    if (!isUuid) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const resp = await fetch(`${API_URL}/users/${encodeURIComponent(input)}`, { credentials: 'include' });
        if (!resp.ok) { setError('User not found'); setTimeout(() => setError(''), 4000); return; }
        const data = await resp.json();
        peerId = data.id;
        peerUsername = data.username ?? input;
        peerAvatar = data.avatarUrl ?? null;
      } catch {
        setError('Could not resolve user');
        setTimeout(() => setError(''), 4000);
        return;
      }
    }

    setActivePeer({ id: peerId, username: peerUsername, avatarUrl: peerAvatar });
    setMessages([]);
    setNewRecipient('');
    setShowNewDm(false);
    socketRef.current?.emit('openConversation', { peerId });
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pt-10 h-[calc(100vh-4rem)]">
      <div className="flex gap-4 h-full">

        {/* ── Sidebar ── */}
        <div className="w-64 hidden md:flex flex-col gap-3 flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Messages</span>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-zinc-600'}`} />
            </div>
            <button
              onClick={() => setShowNewDm(!showNewDm)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-monad-400 hover:bg-monad-400/10 transition-colors text-lg leading-none"
              title="New conversation"
            >
              +
            </button>
          </div>

          {/* New DM input */}
          {showNewDm && (
            <div className="flex gap-2 px-1">
              <input
                type="text" value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startNewDm()}
                placeholder="Username or user ID"
                className="terminal-input text-xs py-2 flex-1"
              />
              <button onClick={startNewDm} className="btn-neon text-xs py-1.5 px-3">Go</button>
            </div>
          )}

          {/* Category tabs */}
          <div className="flex gap-1 px-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all duration-150 ${
                  activeCategory === cat.id
                    ? 'bg-monad-500/20 text-monad-400 border border-monad-400/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {filteredContacts.map(c => (
              <button
                key={c.user.id}
                onClick={() => openConversation(c)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                  activePeer?.id === c.user.id
                    ? 'bg-monad-400/10 border border-monad-400/20'
                    : 'hover:bg-white/4 border border-transparent'
                }`}
              >
                <Avatar name={c.user.username} url={c.user.avatarUrl} size={8} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                      @{c.user.username || c.user.id.slice(0, 8)}
                    </span>
                    {c.unread > 0 && (
                      <span className="text-xs bg-monad-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.lastMessage}</p>
                </div>
              </button>
            ))}
            {filteredContacts.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                {activeCategory === 'all'
                  ? 'No conversations yet. Start a new one.'
                  : `No ${activeCategory} yet.`}
              </p>
            )}
          </div>
        </div>

        {/* ── Main conversation ── */}
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>

          {!activePeer ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-monad-500/10 border border-monad-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-monad-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Direct Messages</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                Select a conversation or start a new one
              </p>
              <button onClick={() => setShowNewDm(true)}
                className="btn-primary text-xs px-5 py-2 rounded-xl">
                New message
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <Avatar name={activePeer.username} url={activePeer.avatarUrl} size={8} />
                <div>
                  {activePeer.username ? (
                    <Link href={`/u/${activePeer.username}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--text)' }}>
                      @{activePeer.username}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {activePeer.id.slice(0, 8)}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: connected ? '#4ade80' : 'var(--text-muted)' }}>
                    {connected ? 'Online' : 'Connecting...'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && <Avatar name={msg.senderUsername} url={msg.senderAvatar} size={7} />}
                      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          {isMe ? 'You' : `@${msg.senderUsername}`} · {formatTime(msg.createdAt)}
                        </p>
                        <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                          isMe ? 'bg-monad-500 text-white rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
                        }`}
                          style={!isMe ? { background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' } : {}}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    No messages yet. Start the conversation.
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                <div className="flex gap-2 items-center">
                  <input
                    type="text" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown} disabled={!connected}
                    placeholder={connected ? `Message @${activePeer.username || '...'}` : 'Connecting...'}
                    maxLength={2000}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                  <button onClick={sendMessage} disabled={!connected || !input.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all
                               disabled:opacity-40 hover:opacity-90"
                    style={{ background: 'var(--brand)', color: '#fff' }}>
                    <SendIcon />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
