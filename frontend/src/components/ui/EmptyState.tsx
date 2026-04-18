'use client';

import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const primaryStyle = {
    background: 'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
    boxShadow:
      'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center py-16 px-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40"
        style={{ background: 'rgba(131,110,249,0.18)' }}
      />
      {Icon && (
        <div
          className="relative w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px -6px rgba(131,110,249,0.45)',
          }}
        >
          <Icon className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="relative text-lg font-light text-white tracking-[-0.005em] mb-1.5">{title}</h3>
      <p className="relative text-[13px] text-zinc-400 text-center max-w-sm mb-6 tracking-[0.005em] leading-relaxed">
        {description}
      </p>
      {action &&
        (action.href ? (
          <a
            href={action.href}
            className="relative inline-flex items-center gap-2 h-10 px-4 rounded-lg font-light text-[13px] text-white transition-all hover:brightness-110 tracking-[0.005em]"
            style={primaryStyle}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="relative inline-flex items-center gap-2 h-10 px-4 rounded-lg font-light text-[13px] text-white transition-all hover:brightness-110 tracking-[0.005em]"
            style={primaryStyle}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
