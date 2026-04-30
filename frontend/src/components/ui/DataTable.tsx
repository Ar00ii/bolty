'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import React from 'react';
import { useState } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data];
  if (sortKey && sortDir) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const surfaceStyle = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="skeleton h-12 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative text-center py-14 rounded-xl overflow-hidden"
        style={surfaceStyle}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(20, 241, 149,0.5) 50%, transparent 100%)',
          }}
        />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.08 }}
          className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
          style={{
            background: 'rgba(20, 241, 149,0.08)',
            border: '1px solid rgba(20, 241, 149,0.18)',
          }}
        >
          <Inbox className="w-4 h-4 text-[#a89dff]" strokeWidth={1.75} />
        </motion.div>
        <p className="text-[13px] text-zinc-300 font-semibold tracking-[0.005em]">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-x-auto rounded-xl"
      style={surfaceStyle}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(20, 241, 149,0.4) 50%, transparent 100%)',
        }}
      />
      <table className="w-full">
        <thead>
          <tr
            className="border-b border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.015)' }}
          >
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 ${col.className || ''}`}
                >
                  {col.sortable ? (
                    <motion.button
                      onClick={() => handleSort(col.key)}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isSorted ? 'text-[#7DFFBF]' : 'hover:text-zinc-300'
                      }`}
                    >
                      {col.label}
                      <AnimatePresence mode="wait" initial={false}>
                        {isSorted && (
                          <motion.span
                            key={sortDir}
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 2 }}
                            transition={{ duration: 0.14 }}
                            className="inline-flex"
                          >
                            {sortDir === 'asc' ? (
                              <ChevronUp className="w-3 h-3" strokeWidth={2} />
                            ) : (
                              <ChevronDown className="w-3 h-3" strokeWidth={2} />
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <motion.tr
              key={String(row[rowKey])}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(idx * 0.025, 0.2),
                duration: 0.22,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`px-4 py-3 text-[13px] text-zinc-300 font-semibold tracking-[0.005em] ${col.className || ''}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
