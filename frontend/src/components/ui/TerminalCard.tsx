import React from 'react';
import { clsx } from 'clsx';

interface TerminalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showDots?: boolean;
}

export function TerminalCard({
  title,
  children,
  className,
  showDots = true,
}: TerminalCardProps) {
  return (
    <div className={clsx('terminal-card', className)}>
      {(showDots || title) && (
        <div className="terminal-header">
          {showDots && (
            <div className="flex items-center gap-1.5">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
            </div>
          )}
          {title && (
            <span className="text-terminal-muted text-xs ml-2 font-mono">{title}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
