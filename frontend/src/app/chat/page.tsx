'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export default function ChatPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(`${WS_URL}/chat`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('history', (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('userCount', (count: number) => {
      setUserCount(count);
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    });

    socket.on('reportSuccess', () => {
      setError('Report submitted. Thank you.');
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !socketRef.current || !connected) return;
    socketRef.current.emit('sendMessage', { content });
    setInput('');
  }, [input, connected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reportMessage = (messageId: string) => {
    const reason = prompt('Reason for reporting:');
    if (reason && reason.trim().length >= 5) {
      socketRef.current?.emit('reportMessage', { messageId, reason });
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-neon-400 font-mono animate-pulse">Connecting...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full gap-3">
        {/* Header */}
        <TerminalCard showDots={false} className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-neon-400 font-mono font-bold">GLOBAL_CHAT</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-400' : 'bg-red-500'}`}
                  style={connected ? { boxShadow: '0 0 6px #39e87c' } : {}} />
                <span className="text-terminal-muted text-xs">
                  {connected ? 'connected' : 'disconnected'}
                </span>
              </div>
            </div>
            <div className="text-terminal-muted text-xs font-mono">
              {userCount} online
            </div>
          </div>
        </TerminalCard>

        {/* Messages */}
        <TerminalCard title="messages" className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 group animate-fade-in ${
                  msg.userId === user?.id ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="shrink-0 w-7 h-7 rounded bg-terminal-border flex items-center justify-center overflow-hidden">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neon-400 text-xs font-mono">
                      {(msg.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={`max-w-[75%] ${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    {msg.userId !== user?.id && (
                      <span className="text-neon-400 text-xs font-mono">
                        {msg.username || 'anonymous'}
                      </span>
                    )}
                    <span className="text-terminal-muted text-xs">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded text-sm font-mono leading-relaxed ${
                      msg.userId === user?.id
                        ? 'bg-neon-400/10 border border-neon-400/30 text-neon-400'
                        : 'bg-terminal-card border border-terminal-border text-terminal-text'
                    }`}
                    // Sanitized server-side — safe to render
                  >
                    {msg.content}
                  </div>
                </div>
                {msg.userId !== user?.id && (
                  <button
                    onClick={() => reportMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-terminal-muted hover:text-red-400 text-xs font-mono self-center"
                    title="Report message"
                  >
                    !
                  </button>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-terminal-muted text-sm text-center py-8 font-mono">
                {'// No messages yet. Be the first to say something.'}
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        </TerminalCard>

        {/* Input */}
        <div className="terminal-card">
          {error && (
            <div className={`text-xs font-mono mb-2 px-1 ${
              error.includes('submitted') ? 'text-neon-400' : 'text-red-400'
            }`}>
              {error}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <span className="text-neon-400 font-mono text-sm shrink-0">
              {user?.username || 'you'}&gt;
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!connected}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              maxLength={500}
              className="terminal-input flex-1"
            />
            <span className="text-terminal-muted text-xs shrink-0">
              {input.length}/500
            </span>
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="btn-neon py-1.5 px-4 text-sm disabled:opacity-50"
            >
              send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
