'use client';

import { ArrowRight } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  classes?: string;
}

export default function InteractiveHoverButton({
  text = 'Button',
  classes,
  className,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      className={cn(
        'group relative flex min-w-40 items-center justify-center overflow-hidden rounded-full border border-atlas-500/40 bg-transparent p-2 px-6 font-light text-white transition-all duration-300',
        classes,
        className,
      )}
      {...props}
    >
      {/* expanding dot */}
      <div className="absolute left-5 h-2 w-2 rounded-full bg-atlas-500 scale-0 transition-all duration-500 group-hover:scale-[40]" />
      {/* default text */}
      <span className="relative inline-block transition-all duration-500 group-hover:translate-x-20 group-hover:opacity-0 z-10">
        {text}
      </span>
      {/* hover text + arrow */}
      <div className="text-white absolute left-0 z-10 flex h-full w-full -translate-x-full items-center justify-center gap-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}

/** Link-compatible version — wrap inside a Next.js <Link> */
export function InteractiveHoverLinkInner({
  text = 'Button',
  classes,
  className,
}: {
  text?: string;
  classes?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-atlas-500/40 bg-transparent py-2 px-6 font-light text-white transition-all duration-300',
        classes,
        className,
      )}
    >
      <span className="absolute left-5 h-2 w-2 rounded-full bg-atlas-500 scale-0 transition-all duration-500 group-hover:scale-[40]" />
      <span className="relative inline-block transition-all duration-500 group-hover:translate-x-20 group-hover:opacity-0 z-10">
        {text}
      </span>
      <span className="text-white absolute left-0 z-10 flex h-full w-full -translate-x-full items-center justify-center gap-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="h-4 w-4" />
      </span>
    </span>
  );
}
