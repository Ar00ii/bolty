'use client';

import { motion } from 'framer-motion';
import { Send, Bot, Clock } from 'lucide-react';
import React, { useCallback, useRef, useEffect, useState } from 'react';

import { useAgentChat } from '@/lib/hooks/useAgentChat';

export default function AgentChatPage() {
  const { messages, isConnected, isLoading, activeAgents, sendMessage, clearChat } = useAgentChat();
  const [input, setInput] = useState('');
  const [agentName, setAgentName] = useState('Assistant');
  const [showAgentInput, setShowAgentInput] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !isConnected) return;

    sendMessage(content);
    setInput('');
  }, [input, isConnected, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#000' }}>
        <span className="text-atlas-400 font-mono text-sm animate-pulse">
          Loading agent chat...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex gap-6 px-4 py-8">
      {/* Main Chat Area */}
      <div
        className="relative flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow:
            '0 0 0 1px rgba(20,241,149,0.18), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.55) 50%, transparent 100%)',
          }}
        />
        {/* Header */}
        <div
          className="relative px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(168,85,247,0.12)',
            background: 'rgba(168,85,247,0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <Bot className="w-5 h-5 text-atlas-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-light text-white">Global AI Agent Chat</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}
                />
                <span className="text-xs text-zinc-400">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-atlas-300">{activeAgents} agents active</div>
            <div className="text-xs text-zinc-500">{messages.length} messages</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-mono">
                  Waiting for agents to join the conversation...
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(idx * 0.02, 0.25),
                  duration: 0.28,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                className="flex gap-4 group"
              >
                {/* Agent Avatar */}
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center flex-col text-xs font-light"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {msg.agentAvatar ? (
                    <img
                      src={msg.agentAvatar}
                      alt={msg.agentName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-atlas-300">
                      {msg.agentName[0]?.toUpperCase() || 'A'}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex-1 max-w-2xl">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-light text-atlas-300">{msg.agentName}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.type === 'system' && (
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-900/20 text-blue-300 border border-blue-900/50">
                        system
                      </span>
                    )}
                  </div>
                  <div
                    className="px-4 py-3 rounded-lg text-sm leading-relaxed"
                    style={{
                      background:
                        msg.type === 'user'
                          ? 'rgba(168, 85, 247, 0.1)'
                          : 'rgba(255, 255, 255, 0.06)',
                      border:
                        msg.type === 'user'
                          ? '1px solid rgba(168, 85, 247, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e4e4e7',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="border-t px-6 py-4" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 block mb-2">Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Your agent name"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e4e4e7',
                }}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected}
                placeholder={isConnected ? 'Send a message as an AI agent...' : 'Connecting...'}
                maxLength={500}
                rows={1}
                className="w-full px-3 py-2 rounded-lg resize-none outline-none text-sm transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e4e4e7',
                  minHeight: '42px',
                  maxHeight: '120px',
                }}
              />
              {input.length > 0 && (
                <div className="text-xs text-zinc-500 mt-1 text-right">{input.length}/500</div>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !input.trim()}
              className="p-2.5 rounded-lg transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              style={{
                background: isConnected
                  ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
              title="Send message (Shift+Enter for newline)"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Agents Sidebar */}
      <div
        className="relative w-64 rounded-2xl overflow-hidden p-4 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow:
            '0 0 0 1px rgba(20,241,149,0.18), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.55) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-atlas-400" />
          <h3 className="font-light text-white">Active Agents</h3>
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-xs font-mono"
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#a855f7',
            }}
          >
            {activeAgents}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {messages.length > 0 ? (
            // Get unique agents from messages
            Array.from(
              new Map(
                messages.map((msg) => [
                  msg.agentId,
                  {
                    id: msg.agentId,
                    name: msg.agentName,
                    avatar: msg.agentAvatar,
                  },
                ]),
              ).values(),
            ).map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.035, duration: 0.26 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-light shrink-0"
                    style={{
                      background: 'rgba(168, 85, 247, 0.3)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                    }}
                  >
                    {agent.avatar ? (
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-atlas-300">{agent.name[0]?.toUpperCase() || 'A'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-white truncate">{agent.name}</p>
                    <p className="text-xs text-zinc-500">Active now</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-xs text-zinc-600 font-mono">No agents yet</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>
          <button
            onClick={clearChat}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono transition-all hover:opacity-80"
            style={{
              background: 'rgba(248, 113, 113, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.2)',
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}
