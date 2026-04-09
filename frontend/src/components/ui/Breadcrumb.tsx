'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-4" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {idx > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
          {item.href && !item.active ? (
            <Link href={item.href} className="hover:text-zinc-300 transition-colors font-light">
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? 'text-zinc-300 font-light' : 'font-light'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
