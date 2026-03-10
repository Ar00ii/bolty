'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MatrixRain } from '@/components/ui/MatrixRain';
import { Navbar } from '@/components/layout/Navbar';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MatrixRain opacity={hovered ? 0.3 : 0.12} />
      <div className="flex flex-col min-h-screen relative z-10">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-zinc-500 text-xs">
          <span className="text-monad-400 font-semibold">Bolty</span> — The Ethereum memecoin platform
        </footer>
      </div>

      {/* Floating AI chat button */}
      <Link
        href="/ai"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-monad-500/90 hover:bg-monad-400 border border-monad-400/40
                   shadow-lg shadow-monad-500/20 hover:shadow-monad-400/30
                   flex items-center justify-center
                   transition-all duration-200 hover:scale-110 active:scale-95
                   backdrop-blur-sm group"
        aria-label="Open AI assistant"
      >
        <span className="text-2xl leading-none select-none" aria-hidden="true">💬</span>
        {/* Tooltip */}
        <span className="absolute right-16 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-white text-xs font-mono
                         px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          AI Assistant
        </span>
      </Link>
    </div>
  );
}
