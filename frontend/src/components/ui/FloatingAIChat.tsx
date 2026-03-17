'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, MessageSquare, Bot, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api } from '@/lib/api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom left' },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.18 } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } },
};

export function FloatingAIChat() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const data = await api.post<{ sessionId: string }>('/ai/sessions', {});
    setSessionId(data.sessionId);
    return data.sessionId;
  };

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    setStreaming(true);

    let assistantContent = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const sid = await ensureSession();
      await api.stream(
        `/ai/sessions/${sid}/chat`,
        { message: content },
        (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: assistantContent };
            return next;
          });
        },
        () => setStreaming(false),
        (err) => {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: `Error: ${err}` };
            return next;
          });
          setStreaming(false);
        },
      );
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: 'Failed to connect to AI.' };
        return next;
      });
      setStreaming(false);
    }
  }, [input, streaming, sessionId]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-80 overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: 'rgba(18,18,21,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(131,110,249,0.2)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              height: '440px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'rgba(131,110,249,0.15)', background: 'rgba(131,110,249,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)' }}>
                  <Bot className="w-3.5 h-3.5 text-monad-400" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">AI Assistant</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse" />
                    <span className="text-xs text-monad-400/70">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setSessionId(null); }}
                    className="text-xs px-2 py-1 rounded-md transition-colors hover:text-white"
                    style={{ color: 'rgba(161,161,170,0.6)' }}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(161,161,170,0.7)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.2)' }}>
                    <Bot className="w-5 h-5 text-monad-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">AI Assistant</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    {isAuthenticated
                      ? 'Ask me anything about development, code, or the platform.'
                      : 'Sign in to use the AI assistant.'}
                  </p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === 'user' ? '' : ''
                    }`}
                      style={msg.role === 'user'
                        ? { background: 'rgba(131,110,249,0.2)', border: '1px solid rgba(131,110,249,0.3)' }
                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {msg.role === 'user'
                        ? <User className="w-3 h-3 text-monad-400" strokeWidth={2} />
                        : <Bot className="w-3 h-3 text-zinc-400" strokeWidth={2} />
                      }
                    </div>
                    <div
                      className="max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                      style={msg.role === 'user'
                        ? { background: 'rgba(131,110,249,0.2)', color: '#e4e4e7', borderRadius: '12px 12px 4px 12px', border: '1px solid rgba(131,110,249,0.25)' }
                        : { background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', borderRadius: '12px 12px 12px 4px', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {msg.content || (streaming && i === messages.length - 1 ? (
                        <div className="flex gap-1 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : '')}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(131,110,249,0.12)' }}>
              {isAuthenticated ? (
                <div className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={streaming}
                    placeholder="Ask anything..."
                    maxLength={1000}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e4e4e7',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || streaming}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', color: '#fff' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <a
                  href="/auth"
                  className="block text-center text-xs py-2.5 rounded-xl font-medium transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', color: '#fff' }}
                >
                  Sign in to chat
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer"
        style={open
          ? { background: 'rgba(39,39,42,0.95)', border: '1px solid rgba(131,110,249,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }
          : { background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', border: '1px solid rgba(131,110,249,0.3)', boxShadow: '0 4px 20px rgba(131,110,249,0.3)' }
        }
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {open
          ? <X className="w-5 h-5 text-zinc-300" strokeWidth={2} />
          : <MessageSquare className="w-5 h-5 text-white" strokeWidth={1.8} />
        }
      </motion.button>
    </div>
  );
}
