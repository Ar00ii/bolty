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
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        aria-label="Previous page"
        className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
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
                className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                  isCurrent
                    ? 'bg-monad-500/20 border border-monad-500/30 text-monad-300'
                    : isEllipsis
                      ? 'text-zinc-600 cursor-default'
                      : 'border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
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
        className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
