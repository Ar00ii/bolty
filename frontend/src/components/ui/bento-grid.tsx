'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-2.5 auto-rows-[210px]', className)}>
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
        'border border-white/[0.07] bg-[rgba(12,12,20,0.9)]',
        'hover:border-monad-500/25 transition-colors duration-300',
        className,
      )}
    >
      {/* Background visual */}
      <div className="absolute inset-0 pointer-events-none">{background}</div>

      {/* Content */}
      <div className="relative z-10 mt-auto">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5"
          style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.18)' }}>
          <Icon className="w-3.5 h-3.5 text-monad-400" strokeWidth={1.5} />
        </div>
        <div className="text-[13px] font-light text-zinc-200 mb-0.5 leading-tight">{name}</div>
        <div className="text-[11px] text-zinc-500 leading-relaxed">{description}</div>
        {href && cta && (
          <a href={href} className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-monad-400 hover:text-monad-300 transition-colors opacity-0 group-hover:opacity-100">
            {cta}
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
