'use client';

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
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        aria-label="Previous page"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:border-white/10 disabled:hover:text-zinc-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
      </button>

      <ol className="flex gap-1 list-none m-0 p-0">
        {pages.map((page, idx) => {
          const isCurrent = page === currentPage;
          const isEllipsis = page === '...';
          return (
            <li key={idx}>
              <button
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={isEllipsis || isLoading}
                aria-label={
                  isEllipsis
                    ? undefined
                    : isCurrent
                      ? `Page ${page}, current`
                      : `Go to page ${page}`
                }
                aria-current={isCurrent ? 'page' : undefined}
                aria-hidden={isEllipsis ? 'true' : undefined}
                className={`min-w-9 h-9 px-3 rounded-lg text-[13px] font-medium tracking-[0.01em] transition-colors ${
                  isCurrent
                    ? 'text-white'
                    : isEllipsis
                      ? 'text-zinc-600 cursor-default'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                style={
                  isCurrent
                    ? {
                        background:
                          'linear-gradient(180deg, rgba(131,110,249,0.2) 0%, rgba(131,110,249,0.08) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 16px -4px rgba(131,110,249,0.4)',
                      }
                    : undefined
                }
              >
                {page}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        aria-label="Next page"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:border-white/10 disabled:hover:text-zinc-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
      </button>
    </nav>
  );
}
