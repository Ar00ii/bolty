'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-3 auto-rows-[180px]', className)}>
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  description,
  Icon,
  className,
  background,
  href,
  cta,
}: {
  name: string;
  description: string;
  Icon: React.ElementType;
  className?: string;
  background?: React.ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between',
        'border border-white/[0.06] bg-[rgba(10,10,20,0.85)] backdrop-blur-sm',
        'hover:border-monad-500/30 transition-all duration-300',
        className,
      )}
    >
      {/* Background visual */}
      <div className="absolute inset-0 pointer-events-none">{background}</div>

      {/* Content */}
      <div className="relative z-10 mt-auto">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.2)' }}>
          <Icon className="w-4 h-4 text-monad-400" />
        </div>
        <div className="text-sm font-semibold text-zinc-200 mb-1">{name}</div>
        <div className="text-xs text-zinc-500 leading-relaxed">{description}</div>
        {href && cta && (
          <a href={href} className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-monad-400 hover:text-monad-300 transition-colors opacity-0 group-hover:opacity-100">
            {cta} →
          </a>
        )}
      </div>
    </div>
  );
}
