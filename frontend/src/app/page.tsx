'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { api } from '@/lib/api/client';

interface PriceData {
  price: number;
  change24h: number;
  volume24h: number;
}

const BOOT_LINES = [
  'Initializing Bolty Terminal v1.0.0...',
  'Loading security modules... [OK]',
  'Connecting to blockchain... [OK]',
  'Loading AI subsystem... [OK]',
  'WebSocket server ready... [OK]',
  'System operational. Welcome to Bolty.',
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI_CHATBOT',
    desc: 'Powered by Google Gemini. Ask anything about crypto and DeFi.',
    href: '/ai',
  },
  {
    icon: '💬',
    title: 'GLOBAL_CHAT',
    desc: 'Real-time WebSocket chat with the Bolty community.',
    href: '/chat',
  },
  {
    icon: '📈',
    title: 'LIVE_CHART',
    desc: 'Real-time Bolty price chart and market data.',
    href: '/chart',
  },
  {
    icon: '🐙',
    title: 'REPO_SHOWCASE',
    desc: 'Share and discover GitHub repositories. Vote for the best.',
    href: '/repos',
  },
];

export default function HomePage() {
  const [bootIndex, setBootIndex] = useState(0);
  const [price, setPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    if (bootIndex < BOOT_LINES.length) {
      const timer = setTimeout(() => setBootIndex((i) => i + 1), 400);
      return () => clearTimeout(timer);
    }
  }, [bootIndex]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await api.get<PriceData>('/chart/price');
        setPrice(data);
      } catch {
        // Price unavailable
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 relative">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-neon-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="text-terminal-muted text-sm mb-4 font-mono">
            <span className="text-neon-400">root@bolty</span>:~$
            <span className="ml-2 animate-cursor-blink">_</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-mono font-black mb-4">
            <span className="text-neon-glow">BOLTY</span>
          </h1>

          <p className="text-terminal-muted text-lg font-mono mb-2">
            {'// The memecoin platform built different'}
          </p>

          {price && (
            <div className="inline-flex items-center gap-3 bg-terminal-card border border-terminal-border rounded px-4 py-2 mt-4">
              <span className="text-terminal-muted text-xs">BOLTY/USD</span>
              <span className="text-neon-400 font-mono font-bold">
                ${price.price.toFixed(8)}
              </span>
              <span
                className={
                  price.change24h >= 0
                    ? 'text-green-400 text-xs'
                    : 'text-red-400 text-xs'
                }
              >
                {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
              </span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/chart" className="btn-neon-solid px-8 py-3 rounded text-base">
              Buy Bolty
            </Link>
            <Link href="/ai" className="btn-neon px-8 py-3 rounded text-base">
              Talk to AI
            </Link>
          </div>
        </div>
      </div>

      {/* Boot sequence */}
      <TerminalCard title="system_boot.log" className="mb-12 max-w-2xl mx-auto">
        <div className="space-y-1">
          {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
            <div key={i} className="text-sm font-mono">
              {i < bootIndex - 1 ? (
                <span className="text-terminal-text">{line}</span>
              ) : (
                <TypewriterText text={line} speed={20} className="text-neon-400" />
              )}
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {FEATURES.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <div className="terminal-card h-full hover:border-neon-400/50 transition-all duration-300 group cursor-pointer">
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="text-neon-400 font-mono font-semibold text-sm mb-2 group-hover:text-neon-300">
                {feature.title}
              </h3>
              <p className="text-terminal-muted text-xs leading-relaxed">{feature.desc}</p>
              <div className="mt-3 text-neon-400/60 text-xs group-hover:text-neon-400 transition-colors">
                → enter
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Security Badge */}
      <TerminalCard className="max-w-2xl mx-auto text-center">
        <div className="text-terminal-muted text-xs font-mono space-y-1">
          <div className="text-neon-400 font-semibold mb-2">SECURITY_STATUS: ACTIVE</div>
          <div className="flex flex-wrap justify-center gap-3">
            {['OWASP Top 10', 'Rate Limited', 'JWT Auth', 'CSRF Protected', 'Input Sanitized', 'XSS Protected'].map(
              (badge) => (
                <span key={badge} className="terminal-badge">{badge}</span>
              ),
            )}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
