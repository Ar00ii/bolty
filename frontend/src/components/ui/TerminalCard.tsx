import { clsx } from 'clsx';
import React from 'react';

interface TerminalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showDots?: boolean; // kept for API compat, no longer rendered
}

export function TerminalCard({ title, children, className }: TerminalCardProps) {
  return (
    <div className={clsx('terminal-card', className)}>
      {title && (
        <div className="terminal-header">
          <span className="text-zinc-500 text-xs font-mono">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
