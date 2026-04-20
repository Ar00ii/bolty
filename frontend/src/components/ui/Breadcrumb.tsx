'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

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
    <motion.nav
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex items-center gap-2 text-xs text-zinc-500 mb-4"
      aria-label="Breadcrumb"
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: idx * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex items-center gap-2"
        >
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
        </motion.div>
      ))}
    </motion.nav>
  );
}
