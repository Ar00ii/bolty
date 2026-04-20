'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Zap, Users, Clock, Eye, Search, X, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_URL, WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string | null;
  senderAvatar: string | null;
  createdAt: string;
  isRead: boolean;
  isAgentMessage?: boolean;
  agentName?: string;
}

interface Contact {
  user: { id: string; username: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastAt: string;
  unread: number;
  type?: 'friend' | 'agent' | 'random' | 'pending';
}

interface AgentNegotiation {
  id: string;
  agents: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  status: 'negotiating' | 'completed' | 'failed';
  bothViewing: boolean;
  messages: DMMessage[];
}

function Avatar({
  name,
  url,
  size = 8,
  badge,
}: {
  name?: string | null;
  url?: string | null;
  size?: number;
  badge?: 'agent' | 'online';
}) {
  const sz = `w-${size} h-${size}`;
  const sizeClass = `w-${size} h-${size}`;

  return (
    <div className="relative">
      {url ? (
        <img
          src={url}
          alt={name || ''}
          className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center text-bolty-300 font-light text-xs`}
          style={{
            background: 'linear-gradient(135deg, rgba(167,137,250,0.2), rgba(131,110,249,0.15))',
            border: '1px solid rgba(167,137,250,0.3)',
          }}
        >
          {(name || '?')[0].toUpperCase()}
        </div>
      )}
      {badge === 'agent' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-bolty-400 rounded-full border border-black" />
      )}
      {badge === 'online' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black" />
      )}
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

type ContactCategory = 'all' | 'friends' | 'agents' | 'random' | 'pending';

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
  const [contactQuery, setContactQuery] = useState('');
  const [bothViewing, setBothViewing] = useState(false);
  const [isAgentChat, setIsAgentChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Latest refs so socket handlers see fresh values without re-subscribing on
  // every activePeer/user change (which would tear down & reopen the socket
  // and race with in-flight messages).
  const activePeerRef = useRef<Contact['user'] | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  const CATEGORIES: { id: ContactCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <MessageSquare size={14} /> },
    { id: 'friends', label: 'Friends', icon: <Users size={14} /> },
    { id: 'agents', label: 'AI Agents', icon: <Zap size={14} /> },
    { id: 'random', label: 'Randoms', icon: <Users size={14} /> },
    { id: 'pending', label: 'Pending', icon: <Clock size={14} /> },
  ];

  const filteredContacts = contacts.filter((c) => {
    if (activeCategory !== 'all' && c.type !== activeCategory) return false;
    const q = contactQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${c.user.username || ''} ${c.lastMessage || ''}`.toLowerCase();
    return haystack.includes(q);
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(`${WS_URL}/dm`, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('contacts', (data: Contact[]) => setContacts(data));
    socket.on(
      'conversation',
      ({
        peerId,
        messages: msgs,
        isAgentNegotiation,
      }: {
        peerId: string;
        messages: DMMessage[];
        isAgentNegotiation?: boolean;
      }) => {
        if (activePeerRef.current?.id === peerId) {
          setMessages(msgs);
          setIsAgentChat(isAgentNegotiation ?? false);
        }
      },
    );
    socket.on('newDM', ({ peerId, message }: { peerId: string; message: DMMessage }) => {
      const activeId = activePeerRef.current?.id;
      const myId = userIdRef.current;
      const belongsToActive = activeId === peerId;
      setMessages((prev) => {
        if (!belongsToActive) return prev;
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setContacts((prev) =>
        prev.map((c) => {
          if (c.user.id !== peerId) return c;
          return {
            ...c,
            lastMessage: message.content.slice(0, 60),
            lastAt: message.createdAt,
            unread: belongsToActive ? c.unread : c.unread + (message.senderId !== myId ? 1 : 0),
          };
        }),
      );
    });
    socket.on('bothViewing', (viewing: boolean) => setBothViewing(viewing));
    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = useCallback((contact: Contact) => {
    // Update the ref synchronously so the 'conversation' handler accepts the
    // payload that arrives before React flushes the state update.
    activePeerRef.current = contact.user;
    setActivePeer(contact.user);
    setMessages([]);
    socketRef.current?.emit('openConversation', { peerId: contact.user.id });
    setContacts((prev) =>
      prev.map((c) => (c.user.id === contact.user.id ? { ...c, unread: 0 } : c)),
    );
    setSidebarOpen(false);
  }, []);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !activePeer || !connected) return;
    socketRef.current?.emit('sendDM', { receiverId: activePeer.id, content });
    setInput('');
  }, [input, activePeer, connected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewDm = async () => {
    const input = newRecipient.trim();
    if (!input) return;

    const isUuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(input);
    let peerId = input;
    let peerUsername: string | null = input;
    let peerAvatar: string | null = null;

    if (!isUuid) {
      try {
        const resp = await fetch(`${API_URL}/users/${encodeURIComponent(input)}`, {
          credentials: 'include',
        });
        if (!resp.ok) {
          setError('User not found');
          setTimeout(() => setError(''), 4000);
          return;
        }
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
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-bolty-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pt-10 h-[calc(100vh-4rem)]">
      <div className="flex gap-4 h-full">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ── */}
        <div
          className={[
            'flex flex-col gap-4 flex-shrink-0',
            'fixed z-50 overflow-y-auto transition-transform duration-300',
            sidebarOpen
              ? 'inset-y-0 left-0 w-80 max-w-[85vw] pt-[72px] pb-6 px-4 translate-x-0'
              : '-translate-x-full pointer-events-none w-0',
            'lg:relative lg:translate-x-0 lg:w-72 lg:inset-auto lg:z-auto',
            'lg:pt-0 lg:pb-0 lg:px-0 lg:overflow-y-visible lg:pointer-events-auto',
          ].join(' ')}
          style={sidebarOpen ? {
            background: 'linear-gradient(180deg, rgba(12,12,16,0.99) 0%, rgba(7,7,11,0.99) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '4px 0 24px -4px rgba(0,0,0,0.6), 1px 0 0 rgba(255,255,255,0.04)',
          } : {}}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-3 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white transition-colors lg:hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Close sidebar"
          >
            <X size={15} />
          </button>
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-light text-white">Conversations</span>
              <motion.div
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-zinc-600'}`}
                animate={connected ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <motion.button
              onClick={() => setShowNewDm(!showNewDm)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                color: '#b4a7ff',
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
              }}
              title="New conversation"
            >
              +
            </motion.button>
          </div>

          {/* New DM input */}
          <AnimatePresence>
            {showNewDm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 px-2"
              >
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startNewDm()}
                  placeholder="Username or ID..."
                  className="text-xs py-2 px-3 flex-1 rounded-lg text-white placeholder:text-zinc-500 outline-none transition-all focus:shadow-[0_0_0_1px_rgba(131,110,249,0.45),_0_0_0_4px_rgba(131,110,249,0.12)]"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(131,110,249,0.22), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                />
                <motion.button
                  onClick={startNewDm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs py-2 px-3 rounded-lg text-white font-light transition-all"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px -4px rgba(131,110,249,0.5)',
                  }}
                >
                  Go
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact search */}
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-8 py-2 text-xs rounded-lg text-white placeholder-zinc-500 outline-none transition-all font-light focus:shadow-[0_0_0_1px_rgba(131,110,249,0.45),_0_0_0_4px_rgba(131,110,249,0.12)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            />
            {contactQuery && (
              <button
                onClick={() => setContactQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className={`relative text-[10.5px] uppercase tracking-[0.14em] font-medium px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                    active ? 'text-[#b4a7ff]' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dm-category-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex">{cat.icon}</span>
                  <span className="relative z-10">{cat.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
            <AnimatePresence mode="popLayout">
              {filteredContacts.map((c, idx) => (
                <motion.button
                  key={c.user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => openConversation(c)}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3"
                  style={
                    activePeer?.id === c.user.id
                      ? {
                          background:
                            'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
                          boxShadow:
                            'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.4)',
                        }
                      : {
                          background: 'transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (activePeer?.id !== c.user.id)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (activePeer?.id !== c.user.id)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Avatar
                    name={c.user.username}
                    url={c.user.avatarUrl}
                    size={10}
                    badge={c.type === 'agent' ? 'agent' : 'online'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light truncate text-white">
                        {c.user.username || c.user.id.slice(0, 8)}
                      </span>
                      {c.unread > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[10px] font-mono text-white rounded-full px-2 py-0.5 font-medium flex-shrink-0"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(131,110,249,0.6) 0%, rgba(131,110,249,0.35) 100%)',
                            boxShadow:
                              'inset 0 0 0 1px rgba(131,110,249,0.55), 0 0 12px -2px rgba(131,110,249,0.6)',
                          }}
                        >
                          {c.unread}
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5 text-zinc-500">{c.lastMessage}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            {filteredContacts.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-center py-8 text-zinc-500"
              >
                {contactQuery.trim()
                  ? 'No conversations match your search.'
                  : activeCategory === 'all'
                    ? 'No conversations yet. Start a new one.'
                    : `No ${activeCategory} conversations.`}
              </motion.p>
            )}
          </div>
        </div>

        {/* ── Main conversation ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px z-10"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          {!activePeer ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.04) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 32px -6px rgba(131,110,249,0.5)',
                }}
              >
                <MessageSquare className="w-7 h-7" style={{ color: '#b4a7ff' }} strokeWidth={1.5} />
              </motion.div>
              <h3 className="text-lg font-light mb-2 text-white tracking-[-0.01em]">Messages</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-xs">
                Select a conversation to start chatting or create a new one to connect
              </p>
              <div className="flex flex-col items-center gap-3">
                <motion.button
                  onClick={() => setShowNewDm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-light transition-all"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                  }}
                >
                  New conversation
                </motion.button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Menu size={13} /> Browse conversations
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="relative flex items-center justify-between px-4 py-4"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(131,110,249,0.04)',
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white transition-colors lg:hidden flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    aria-label="Open conversations"
                  >
                    <Menu size={15} />
                  </button>
                  <Avatar
                    name={activePeer.username}
                    url={activePeer.avatarUrl}
                    size={10}
                    badge={isAgentChat ? 'agent' : 'online'}
                  />
                  <div>
                    {activePeer.username ? (
                      <Link
                        href={`/u/${activePeer.username}`}
                        className="text-sm font-light hover:text-bolty-300 transition-colors text-white"
                      >
                        {activePeer.username}
                      </Link>
                    ) : (
                      <p className="text-sm font-light text-white">{activePeer.id.slice(0, 8)}</p>
                    )}
                    <p className="text-xs text-bolty-400">
                      {connected ? 'Online' : 'Connecting...'}
                    </p>
                  </div>
                </div>
                {bothViewing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] font-medium h-7 px-3 rounded-md"
                    style={{
                      color: '#b4a7ff',
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                    }}
                  >
                    <Eye size={12} />
                    Both viewing
                  </motion.div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {isAgentChat
                    ? // AI Agent negotiation view
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.id;
                        const isAgent = msg.isAgentMessage;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                          >
                            {isAgent && (
                              <div className="flex-shrink-0">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-10 h-10 rounded-full bg-gradient-to-br from-bolty-500 to-bolty-600 flex items-center justify-center text-white text-xs font-light border-2 border-bolty-400"
                                >
                                  AI
                                </motion.div>
                              </div>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              {isAgent && (
                                <p className="text-xs font-light text-bolty-300 mb-1">
                                  {msg.agentName || 'Agent'} • {formatTime(msg.createdAt)}
                                </p>
                              )}
                              {!isAgent && (
                                <p className="text-xs font-light text-zinc-400 mb-1">
                                  {isMe ? 'You' : activePeer.username} • {formatTime(msg.createdAt)}
                                </p>
                              )}
                              <div
                                className={`px-4 py-3 text-sm leading-relaxed break-words max-w-md ${
                                  isAgent
                                    ? 'bg-bolty-500/25 text-bolty-100 border border-bolty-500/30 rounded-2xl rounded-tl-lg'
                                    : isMe
                                      ? 'bg-bolty-500 text-white rounded-2xl rounded-tr-lg'
                                      : 'bg-white/8 text-zinc-100 border border-white/10 rounded-2xl rounded-tl-lg'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    : // Regular DM view
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                          >
                            {!isMe && (
                              <Avatar name={msg.senderUsername} url={msg.senderAvatar} size={9} />
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <p className="text-xs font-light text-zinc-400 mb-1">
                                {isMe ? 'You' : msg.senderUsername} • {formatTime(msg.createdAt)}
                              </p>
                              <div
                                className={`px-4 py-3 text-sm leading-relaxed break-words max-w-md ${
                                  isMe
                                    ? 'bg-bolty-500 text-white rounded-2xl rounded-tr-lg'
                                    : 'bg-white/8 text-zinc-100 border border-white/10 rounded-2xl rounded-tl-lg'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                </AnimatePresence>
                {messages.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-center py-16 text-zinc-500"
                  >
                    No messages yet. Start the conversation.
                  </motion.p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                className="px-6 py-4"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(131,110,249,0.03)',
                }}
              >
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-xs mb-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!connected}
                    placeholder={
                      connected ? `Message ${activePeer.username || '...'}...` : 'Connecting...'
                    }
                    maxLength={2000}
                    className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none transition-all text-white placeholder:text-zinc-500 focus:shadow-[0_0_0_1px_rgba(131,110,249,0.45),_0_0_0_4px_rgba(131,110,249,0.12),_inset_0_1px_0_rgba(255,255,255,0.04)]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                      boxShadow:
                        '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!connected || !input.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 text-white"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                    }}
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
