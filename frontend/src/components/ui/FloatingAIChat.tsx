'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api } from '@/lib/api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const data = await api.post<{ sessionId: string }>('/ai/sessions', {});
    setSessionId(data.sessionId);
    return data.sessionId;
  };

  const sendMessage = async () => {
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
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Toggle button - bottom left */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full
                   flex items-center justify-center shadow-lg
                   transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? 'rgba(39,39,42,0.95)'
            : 'linear-gradient(135deg, #836EF9, #6b4fe0)',
          border: '1px solid rgba(131,110,249,0.3)',
          boxShadow: '0 4px 20px rgba(131,110,249,0.25)',
        }}
        aria-label={open ? 'Close AI chat' : 'Open AI assistant'}
      >
        {open ? (
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 left-6 z-50 w-80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            height: '420px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-monad-500/15 border border-monad-500/25 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-monad-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Bolty AI</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); }}
                className="text-xs px-2 py-1 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>AI Assistant</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isAuthenticated
                    ? 'Ask me anything about development, code, or the platform.'
                    : 'Sign in to use the AI assistant.'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: 'var(--brand)', color: '#fff', borderRadius: '12px 12px 4px 12px' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px' }
                  }
                >
                  {msg.content || (streaming && i === messages.length - 1
                    ? <span className="inline-block w-1 h-3 bg-monad-400 animate-pulse rounded-full" />
                    : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
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
                  className="flex-1 text-xs px-3 py-2 rounded-xl outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                  style={{ background: 'var(--brand)', color: '#fff' }}
                >
                  <SendIcon />
                </button>
              </div>
            ) : (
              <a
                href="/auth"
                className="block text-center text-xs py-2 rounded-xl font-medium transition-all"
                style={{ background: 'var(--brand)', color: '#fff' }}
              >
                Sign in to chat
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
