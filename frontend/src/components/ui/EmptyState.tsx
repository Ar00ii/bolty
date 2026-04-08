'use client';

import { LucideIcon } from 'lucide-react';

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
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
      {Icon && (
        <div className="mb-4 p-3 rounded-lg bg-monad-500/10">
          <Icon className="w-8 h-8 text-monad-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-light text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 text-center max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="btn-primary text-sm">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="btn-primary text-sm">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
