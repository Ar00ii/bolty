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
  'Connecting to Solana network... [OK]',
  'Loading AI subsystem... [OK]',
  'WebSocket server ready... [OK]',
  'System operational. Welcome to Bolty.',
];

function AiIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: AiIcon,
    color: 'text-monad-400',
    bgColor: 'bg-monad-500/10',
    borderColor: 'border-monad-500/20',
    hoverBorder: 'hover:border-monad-400/50',
    title: 'AI Assistant',
    desc: 'Powered by Google Gemini. Ask anything about Solana, DeFi, and crypto markets.',
    href: '/ai',
  },
  {
    Icon: ChatIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/50',
    title: 'Global Chat',
    desc: 'Real-time WebSocket chat with the Bolty community.',
    href: '/chat',
  },
  {
    Icon: ChartIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    hoverBorder: 'hover:border-green-400/50',
    title: 'Live Chart',
    desc: 'Real-time Bolty price chart and market data on Solana.',
    href: '/chart',
  },
  {
    Icon: RepoIcon,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/50',
    title: 'Repo Showcase',
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-monad-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-monad-500/10 border border-monad-500/20 text-monad-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse" />
            Built on Solana
          </div>

          <h1 className="text-6xl sm:text-7xl font-mono font-black mb-4 tracking-tight">
            <span className="hero-gradient">BOLTY</span>
          </h1>

          <p className="text-slate-400 text-lg font-mono mb-2">
            {'// The memecoin platform on Solana'}
          </p>

          {price && (
            <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-2.5 mt-4">
              <span className="text-slate-400 text-xs font-mono">BOLTY/USD</span>
              <span className="text-white font-mono font-bold">
                ${price.price.toFixed(8)}
              </span>
              <span
                className={
                  price.change24h >= 0
                    ? 'text-green-400 text-xs font-mono'
                    : 'text-red-400 text-xs font-mono'
                }
              >
                {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
              </span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/chart" className="btn-primary px-8 py-3 rounded-xl text-base">
              Buy Bolty
            </Link>
            <Link href="/ai" className="btn-secondary px-8 py-3 rounded-xl text-base">
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
                <span className="text-slate-300">{line}</span>
              ) : (
                <TypewriterText text={line} speed={20} className="text-monad-400" />
              )}
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {FEATURES.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <div className={`feature-card h-full ${feature.hoverBorder} group cursor-pointer`}>
              <div className={`feature-icon-wrap ${feature.bgColor} border ${feature.borderColor}`}>
                <span className={feature.color}>
                  <feature.Icon />
                </span>
              </div>
              <h3 className={`font-semibold text-sm mb-2 ${feature.color}`}>
                {feature.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
              <div className={`mt-3 text-xs ${feature.color} opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                <span>Open</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Security Badge */}
      <div className="max-w-2xl mx-auto">
        <div className="security-panel">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-green-400 text-xs font-mono font-semibold">SECURITY STATUS: ACTIVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['OWASP Top 10', 'Rate Limited', 'JWT Auth', 'CSRF Protected', 'Input Sanitized', 'XSS Protected'].map(
              (badge) => (
                <span key={badge} className="security-badge">{badge}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
