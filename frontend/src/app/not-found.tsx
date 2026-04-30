import { ArrowLeft, Home, Search } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { GradientText } from '@/components/ui/GradientText';

export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{ background: '#000' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #14F195 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-lg w-full">
        <div className="border-t-2 border-l-2 border-white/20 rounded-tl-2xl p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">Error 404</p>
          <h1 className="text-5xl md:text-6xl font-semibold text-white mb-4">
            Page <GradientText>not found</GradientText>
          </h1>
          <p className="text-zinc-400 font-semibold mb-8 max-w-sm">
            The page you&apos;re looking for has moved, been removed, or never existed. Try one of
            the links below.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-zinc-200 hover:text-white transition-all"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/market"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-bolty-500/30 bg-bolty-500/10 text-bolty-100 hover:bg-bolty-500/20 transition-all"
            >
              <Search className="w-4 h-4" />
              Browse marketplace
            </Link>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Your orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
