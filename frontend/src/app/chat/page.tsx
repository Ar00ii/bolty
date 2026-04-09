'use client';

import { Send, X, Bot, User as UserIcon, Smile } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// Emoji categories for the picker
const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: [
      '😀',
      '😂',
      '😍',
      '🤔',
      '😎',
      '🥳',
      '😭',
      '🤩',
      '😴',
      '🤯',
      '😤',
      '🥺',
      '😈',
      '👻',
      '💀',
      '🤖',
      '👽',
      '🎃',
      '🫡',
      '🫠',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍',
      '👎',
      '👏',
      '🙌',
      '🤝',
      '✌️',
      '🤞',
      '👌',
      '🤌',
      '💪',
      '🦾',
      '🙏',
      '🫶',
      '❤️',
      '🔥',
      '⚡',
      '💯',
      '✅',
      '❌',
      '💎',
    ],
  },
  {
    label: 'Tech',
    emojis: [
      '💻',
      '🖥️',
      '⌨️',
      '🖱️',
      '📱',
      '🤖',
      '🦾',
      '🧠',
      '💡',
      '🔧',
      '⚙️',
      '🚀',
      '🛸',
      '🌐',
      '📡',
      '🔬',
      '🧬',
      '🏗️',
      '🔐',
      '🗝️',
    ],
  },
  {
    label: 'Finance',
    emojis: [
      '💰',
      '💸',
      '📈',
      '📉',
      '🪙',
      '💳',
      '🏦',
      '💹',
      '🤑',
      '🧾',
      '🏆',
      '🥇',
      '🎖️',
      '🎯',
      '📊',
      '📋',
      '🔑',
      '🌟',
      '⭐',
      '🌙',
    ],
  },
];

export default function ChatPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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
      setNotice('');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('history', (msgs: ChatMessage[]) => setMessages(msgs));
    socket.on('newMessage', (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));
    socket.on('userCount', (count: number) => setUserCount(count));
    socket.on('error', (err: { message: string }) => {
      setNotice(err.message);
      setTimeout(() => setNotice(''), 4000);
    });
    socket.on('reportSuccess', () => {
      setNotice('Report submitted. Thank you.');
      setTimeout(() => setNotice(''), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInput((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = input.slice(0, start) + emoji + input.slice(end);
    setInput(newValue);
    // Restore cursor position after emoji insert
    requestAnimationFrame(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    });
  };

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !socketRef.current || !connected) return;
    socketRef.current.emit('sendMessage', { content });
    setInput('');
    setShowEmoji(false);
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#000' }}>
        <span className="text-monad-400 font-mono text-sm animate-pulse">Connecting...</span>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div
        className="flex flex-col h-full rounded-2xl overflow-hidden border"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a0a0b' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(131,110,249,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(131,110,249,0.12)',
                border: '1px solid rgba(131,110,249,0.2)',
              }}
            >
              <Bot className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-sm font-light text-white">Community Chat</h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-monad-400 animate-pulse' : 'bg-red-500'}`}
                />
                <span className="text-xs" style={{ color: 'rgba(161,161,170,0.6)' }}>
                  {connected ? 'connected' : 'disconnected'}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono" style={{ color: 'rgba(161,161,170,0.4)' }}>
            {userCount} online
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm font-mono" style={{ color: 'rgba(161,161,170,0.3)' }}>
                {'// No messages yet. Be the first to say something.'}
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                  style={
                    isMe
                      ? {
                          background: 'rgba(131,110,249,0.2)',
                          border: '1px solid rgba(131,110,249,0.3)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }
                  }
                >
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : isMe ? (
                    <UserIcon className="w-4 h-4 text-monad-400" strokeWidth={2} />
                  ) : (
                    <span className="text-xs font-light text-zinc-400">
                      {(msg.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe &&
                      (msg.username ? (
                        <Link
                          href={`/u/${msg.username}`}
                          className="text-xs font-light text-monad-400 hover:text-monad-300 transition-colors"
                        >
                          {msg.username}
                        </Link>
                      ) : (
                        <span
                          className="text-xs font-light"
                          style={{ color: 'rgba(161,161,170,0.5)' }}
                        >
                          anonymous
                        </span>
                      ))}
                    <span className="text-xs" style={{ color: 'rgba(161,161,170,0.35)' }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className="px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      isMe
                        ? {
                            background: 'rgba(131,110,249,0.2)',
                            color: '#e4e4e7',
                            borderRadius: '12px 12px 4px 12px',
                            border: '1px solid rgba(131,110,249,0.25)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.06)',
                            color: '#d4d4d8',
                            borderRadius: '12px 12px 12px 4px',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Report */}
                {!isMe && (
                  <button
                    onClick={() => reportMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-center"
                    style={{ color: 'rgba(161,161,170,0.3)' }}
                    title="Report message"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="border-t px-4 py-3 relative"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          {notice && (
            <div
              className="text-xs font-mono mb-2 px-1"
              style={{ color: notice.includes('submitted') ? '#836EF9' : '#f87171' }}
            >
              {notice}
            </div>
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full mb-2 left-4 z-50 rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: '#16161a',
                border: '1px solid rgba(131,110,249,0.25)',
                width: 320,
              }}
            >
              {/* Category tabs */}
              <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.label}
                    onClick={() => setActiveEmojiCategory(idx)}
                    className="flex-1 py-2 text-xs font-mono transition-colors"
                    style={{
                      color: activeEmojiCategory === idx ? '#836ef9' : 'rgba(161,161,170,0.5)',
                      background:
                        activeEmojiCategory === idx ? 'rgba(131,110,249,0.1)' : 'transparent',
                      borderBottom:
                        activeEmojiCategory === idx ? '2px solid #836ef9' : '2px solid transparent',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* Emoji grid */}
              <div className="p-3 grid grid-cols-10 gap-1">
                {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-monad-500/20 transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Emoji toggle button */}
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="p-2.5 rounded-xl border transition-all self-end"
              style={{
                borderColor: showEmoji ? 'rgba(131,110,249,0.5)' : 'rgba(255,255,255,0.1)',
                color: showEmoji ? '#836ef9' : 'rgba(161,161,170,0.5)',
                background: showEmoji ? 'rgba(131,110,249,0.1)' : 'transparent',
              }}
              title="Emoji picker"
            >
              <Smile className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!connected}
                placeholder={
                  connected ? `Message as ${user?.username || 'you'}...` : 'Connecting...'
                }
                maxLength={500}
                rows={1}
                className="w-full px-4 py-2.5 rounded-xl resize-none outline-none transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  minHeight: '42px',
                  maxHeight: '128px',
                }}
              />
              {input.length > 0 && (
                <span
                  className="absolute bottom-1.5 right-3 text-xs"
                  style={{ color: 'rgba(161,161,170,0.3)' }}
                >
                  {input.length}/500
                </span>
              )}
            </div>

            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 self-end"
              style={{ background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', color: '#fff' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {input.length === 0 && !showEmoji && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {['Hello everyone', 'Need help with my agent', 'Looking for collaborators'].map(
                (q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1 text-xs rounded-full border transition-colors hover:border-monad-500/40 hover:text-monad-400"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(161,161,170,0.4)',
                    }}
                  >
                    {q}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
