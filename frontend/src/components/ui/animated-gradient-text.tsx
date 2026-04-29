'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export function AnimatedGradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group relative inline-flex items-center justify-center rounded-full px-4 py-1.5',
        'bg-white/5 backdrop-blur-sm shadow-[inset_0_-4px_12px_rgba(20,241,149,0.08)]',
        'transition-shadow duration-500 hover:shadow-[inset_0_-4px_12px_rgba(20,241,149,0.18)]',
        className,
      )}
    >
      {/* Animated gradient border */}
      <span
        className="absolute inset-0 rounded-full p-px [background:linear-gradient(var(--ag-angle,0deg),#14F195,#a7f3d0,#14F195)] animate-[gradientRotate_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          WebkitMask: 'linear-gradient(#fff_0_0) content-box, linear-gradient(#fff_0_0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </div>
  );
}
