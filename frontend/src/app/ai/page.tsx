'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  createdAt: string;
  _count: { messages: number };
  messages: Message[];
}

export default function AiPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.get<Session[]>('/ai/sessions');
      setSessions(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadSessions();
  }, [isAuthenticated, loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedResponse]);

  const createSession = async () => {
    try {
      const { sessionId } = await api.post<{ sessionId: string }>('/ai/sessions', {});
      const session = await api.get<Session>(`/ai/sessions/${sessionId}`);
      setActiveSession(session);
      setMessages([]);
      await loadSessions();
    } catch (err) {
      setError('Failed to create session');
    }
  };

  const loadSession = async (session: Session) => {
    try {
      const full = await api.get<Session>(`/ai/sessions/${session.id}`);
      setActiveSession(full);
      setMessages(full.messages);
    } catch {
      setError('Failed to load session');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Optimistically add user message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setIsStreaming(true);
    setStreamedResponse('');

    await api.stream(
      `/ai/sessions/${activeSession.id}/chat`,
      { message: userMessage },
      (chunk) => setStreamedResponse((prev) => prev + chunk),
      async () => {
        setIsStreaming(false);
        // Reload messages from server
        const full = await api.get<Session>(`/ai/sessions/${activeSession.id}`);
        setMessages(full.messages);
        setStreamedResponse('');
      },
      (err) => {
        setIsStreaming(false);
        setError(err);
        setStreamedResponse('');
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-neon-400 font-mono animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div className="flex gap-4 h-full">
        {/* Sidebar */}
        <div className="w-64 hidden md:flex flex-col gap-2">
          <TerminalCard title="sessions" className="flex-1 overflow-hidden flex flex-col">
            <button
              onClick={createSession}
              className="w-full btn-neon text-sm py-2 mb-3"
            >
              + new_session
            </button>
            <div className="flex-1 overflow-y-auto space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors ${
                    activeSession?.id === s.id
                      ? 'bg-neon-400/10 text-neon-400 border border-neon-400/30'
                      : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-card'
                  }`}
                >
                  <div className="truncate">session_{s.id.slice(-6)}</div>
                  <div className="text-terminal-muted text-xs">{s._count.messages} msgs</div>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-terminal-muted text-xs text-center py-4">No sessions yet</p>
              )}
            </div>
          </TerminalCard>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {!activeSession ? (
            <TerminalCard className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-monad-400 font-mono text-2xl mb-4 tracking-widest">[SYS]</div>
                <h2 className="text-monad-400 font-mono font-bold text-xl mb-2 tracking-widest">
                  BOLTY_AI TERMINAL
                </h2>
                <p className="text-terminal-muted text-xs font-mono mb-6">
                  // neural_network :: online
                </p>
                <button onClick={createSession} className="btn-neon-solid px-6 py-2">
                  start_session
                </button>
              </div>
            </TerminalCard>
          ) : (
            <>
              {/* Messages */}
              <TerminalCard
                title={`session_${activeSession.id.slice(-6)}`}
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      {msg.role === 'ASSISTANT' && (
                        <span className="text-neon-400 font-mono text-sm shrink-0">AI&gt;</span>
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded text-sm font-mono leading-relaxed ${
                          msg.role === 'USER'
                            ? 'bg-neon-400/10 border border-neon-400/30 text-neon-400'
                            : 'bg-terminal-card border border-terminal-border text-terminal-text'
                        }`}
                      >
                        <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                      </div>
                      {msg.role === 'USER' && (
                        <span className="text-terminal-muted font-mono text-sm shrink-0">YOU&gt;</span>
                      )}
                    </div>
                  ))}

                  {/* Streaming response */}
                  {isStreaming && streamedResponse && (
                    <div className="flex gap-3 justify-start animate-fade-in">
                      <span className="text-neon-400 font-mono text-sm shrink-0">AI&gt;</span>
                      <div className="max-w-[80%] px-3 py-2 rounded text-sm font-mono bg-terminal-card border border-terminal-border text-terminal-text leading-relaxed">
                        <pre className="whitespace-pre-wrap font-mono text-xs">{streamedResponse}</pre>
                        <span className="animate-cursor-blink text-neon-400">_</span>
                      </div>
                    </div>
                  )}

                  {isStreaming && !streamedResponse && (
                    <div className="flex gap-3 animate-fade-in">
                      <span className="text-neon-400 font-mono text-sm">AI&gt;</span>
                      <span className="text-neon-400 animate-pulse text-sm font-mono">thinking...</span>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              </TerminalCard>

              {/* Input */}
              <div className="terminal-card">
                {error && (
                  <div className="text-red-400 text-xs font-mono mb-2 px-1">
                    ERROR: {error}
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <span className="text-neon-400 font-mono text-sm pb-2">{'>'}</span>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStreaming}
                    rows={1}
                    placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                    className="terminal-input flex-1 resize-none min-h-[40px] max-h-32"
                    style={{ height: 'auto' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isStreaming || !input.trim()}
                    className="btn-neon py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStreaming ? '...' : 'send'}
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
