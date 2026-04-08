'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

  let sortedData = [...data];
  if (sortKey && sortDir) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 border border-zinc-800 rounded-lg bg-zinc-900/30">
        <p className="text-zinc-400 font-light text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-800 rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-left text-xs font-light text-zinc-300 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-zinc-100 transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      ))}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={String(row[rowKey])}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-4 py-3 text-sm text-zinc-300 font-light ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
