'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';

import { GradientText } from '@/components/ui/GradientText';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{ background: '#000' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-lg w-full">
        <div className="border-t-2 border-l-2 border-white/20 rounded-tl-2xl p-10">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-pink-400" />
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Unexpected error</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Something <GradientText>went wrong</GradientText>
          </h1>
          <p className="text-zinc-400 font-light mb-6 max-w-sm">
            We hit an unexpected error rendering this page. Try again — if it keeps failing, let us
            know.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 p-4 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-zinc-400 font-mono overflow-auto max-h-40">
              <summary className="cursor-pointer text-zinc-300 mb-2">Error details</summary>
              <pre className="whitespace-pre-wrap">{error.message}</pre>
              {error.digest && <p className="mt-2 text-zinc-500">Digest: {error.digest}</p>}
            </details>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-atlas-500/30 bg-atlas-500/10 text-atlas-100 hover:bg-atlas-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-zinc-200 hover:text-white transition-all"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
