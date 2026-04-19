'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const pages = [];
  const maxVisible = 5;
  const halfVisible = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) pages.push(1);
  if (startPage > 2) pages.push('...');

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  if (endPage < totalPages - 1) pages.push('...');
  if (endPage < totalPages) pages.push(totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-8">
      <motion.button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        whileTap={currentPage === 1 || isLoading ? undefined : { scale: 0.92 }}
        whileHover={currentPage === 1 || isLoading ? undefined : { x: -1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        aria-label="Previous page"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:border-white/10 disabled:hover:text-zinc-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
      </motion.button>

      <ol className="flex gap-1 list-none m-0 p-0">
        {pages.map((page, idx) => {
          const isCurrent = page === currentPage;
          const isEllipsis = page === '...';
          return (
            <li key={idx}>
              <motion.button
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={isEllipsis || isLoading}
                whileTap={isEllipsis || isLoading || isCurrent ? undefined : { scale: 0.92 }}
                whileHover={isEllipsis || isLoading || isCurrent ? undefined : { y: -1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                aria-label={
                  isEllipsis
                    ? undefined
                    : isCurrent
                      ? `Page ${page}, current`
                      : `Go to page ${page}`
                }
                aria-current={isCurrent ? 'page' : undefined}
                aria-hidden={isEllipsis ? 'true' : undefined}
                className={`relative min-w-9 h-9 px-3 rounded-lg text-[13px] font-medium tracking-[0.01em] transition-colors ${
                  isCurrent
                    ? 'text-white'
                    : isEllipsis
                      ? 'text-zinc-600 cursor-default'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {isCurrent && (
                  <motion.span
                    layoutId="pagination-current-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.2) 0%, rgba(131,110,249,0.08) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 16px -4px rgba(131,110,249,0.4)',
                    }}
                  />
                )}
                <span className="relative">{page}</span>
              </motion.button>
            </li>
          );
        })}
      </ol>

      <motion.button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        whileTap={currentPage === totalPages || isLoading ? undefined : { scale: 0.92 }}
        whileHover={currentPage === totalPages || isLoading ? undefined : { x: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        aria-label="Next page"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:border-white/10 disabled:hover:text-zinc-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
      </motion.button>
    </nav>
  );
}
