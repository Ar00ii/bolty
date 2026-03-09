'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { TerminalCard } from '@/components/ui/TerminalCard';
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
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(`${WS_URL}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('contacts', (data: Contact[]) => setContacts(data));

    socket.on('conversation', ({ peerId, messages: msgs }: { peerId: string; messages: DMMessage[] }) => {
      if (activePeer?.id === peerId || msgs.length > 0) {
        setMessages(msgs);
      }
    });

    socket.on('newDM', ({ peerId, message }: { peerId: string; message: DMMessage }) => {
      setMessages((prev) => {
        const already = prev.find((m) => m.id === message.id);
        if (already) return prev;
        if (activePeer?.id === peerId || message.senderId === user?.id) {
          return [...prev, message];
        }
        return prev;
      });
      // Update contacts unread
      setContacts((prev) =>
        prev.map((c) => {
          if (c.user.id === peerId) {
            return { ...c, lastMessage: message.content.slice(0, 60), lastAt: message.createdAt };
          }
          return c;
        }),
      );
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = useCallback((contact: Contact) => {
    setActivePeer(contact.user);
    setMessages([]);
    socketRef.current?.emit('openConversation', { peerId: contact.user.id });
    // Mark as read locally
    setContacts((prev) =>
      prev.map((c) => (c.user.id === contact.user.id ? { ...c, unread: 0 } : c)),
    );
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

  const startNewDm = () => {
    const id = newRecipient.trim();
    if (!id) return;
    const tempPeer: Contact['user'] = { id, username: id, avatarUrl: null };
    setActivePeer(tempPeer);
    setMessages([]);
    setNewRecipient('');
    setShowNewDm(false);
    socketRef.current?.emit('openConversation', { peerId: id });
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-monad-400 font-mono animate-pulse">Connecting...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div className="flex gap-4 h-full">

        {/* Sidebar: contact list */}
        <div className="w-64 hidden md:flex flex-col gap-2">
          <TerminalCard title="messages" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
                <span className="text-terminal-muted text-xs">{connected ? 'online' : 'offline'}</span>
              </div>
              <button
                onClick={() => setShowNewDm(!showNewDm)}
                className="text-monad-400 text-xs font-mono hover:text-white transition-colors"
              >
                + new
              </button>
            </div>

            {showNewDm && (
              <div className="mb-3 flex gap-1">
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startNewDm()}
                  placeholder="user id..."
                  className="terminal-input text-xs flex-1 py-1.5"
                />
                <button onClick={startNewDm} className="btn-neon text-xs py-1 px-2">go</button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {contacts.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activePeer?.id === c.user.id
                      ? 'bg-monad-400/10 border border-monad-400/30'
                      : 'hover:bg-terminal-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-monad-400 truncate">
                      @{c.user.username || c.user.id.slice(0, 8)}
                    </span>
                    {c.unread > 0 && (
                      <span className="text-xs bg-monad-400 text-black rounded-full px-1.5 font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-terminal-muted truncate mt-0.5">
                    {c.lastMessage}
                  </div>
                </button>
              ))}
              {contacts.length === 0 && (
                <p className="text-terminal-muted text-xs text-center py-6 font-mono">
                  {'// No conversations yet'}
                </p>
              )}
            </div>
          </TerminalCard>
        </div>

        {/* Main: conversation */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {!activePeer ? (
            <TerminalCard className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-monad-400 font-mono text-2xl mb-3 tracking-widest">[DM]</div>
                <p className="text-terminal-muted text-sm font-mono mb-4">
                  // select a conversation or start a new one
                </p>
                <button
                  onClick={() => setShowNewDm(true)}
                  className="btn-neon-solid px-6 py-2 text-sm"
                >
                  new_message
                </button>
              </div>
            </TerminalCard>
          ) : (
            <>
              {/* Header */}
              <TerminalCard showDots={false} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-terminal-muted font-mono text-sm">pm /</span>
                  <span className="text-monad-400 font-mono font-bold">
                    @{activePeer.username || activePeer.id.slice(0, 8)}
                  </span>
                </div>
              </TerminalCard>

              {/* Messages */}
              <TerminalCard className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="shrink-0 w-7 h-7 rounded bg-terminal-border flex items-center justify-center overflow-hidden">
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-monad-400 text-xs font-mono">
                              {(msg.senderUsername || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-terminal-muted text-xs mb-0.5">
                            {formatTime(msg.createdAt)}
                          </span>
                          <div
                            className={`px-3 py-2 rounded text-sm font-mono leading-relaxed ${
                              isMe
                                ? 'bg-monad-400/10 border border-monad-400/30 text-monad-400'
                                : 'bg-terminal-card border border-terminal-border text-terminal-text'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-terminal-muted text-xs text-center py-8 font-mono">
                      {'// No messages yet. Say something.'}
                    </p>
                  )}
                  <div ref={bottomRef} />
                </div>
              </TerminalCard>

              {/* Input */}
              <div className="terminal-card">
                {error && (
                  <div className="text-red-400 text-xs font-mono mb-2">ERROR: {error}</div>
                )}
                <div className="flex gap-2 items-center">
                  <span className="text-monad-400 font-mono text-sm shrink-0">
                    {user?.username || 'you'}&gt;
                  </span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!connected}
                    placeholder={connected ? 'Type a message...' : 'Connecting...'}
                    maxLength={2000}
                    className="terminal-input flex-1"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!connected || !input.trim()}
                    className="btn-neon py-1.5 px-4 text-sm disabled:opacity-50"
                  >
                    send
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
