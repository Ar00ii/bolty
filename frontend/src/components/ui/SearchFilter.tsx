'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  suggestions?: string[];
  filters?: FilterOption[];
  debounce?: number;
}

export function SearchFilter({
  placeholder = 'Search...',
  onSearch,
  onFilterChange,
  suggestions = [],
  filters = [],
  debounce = 300,
}: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const filteredSuggestions = useMemo(() => {
    if (!query) return [];
    return suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }, [query, suggestions]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setShowSuggestions(!!value);

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounce);
    setDebounceTimer(timer);
  }, [onSearch, debounce, debounceTimer]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev => {
      const updated = prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId];
      onFilterChange?.(updated);
      return updated;
    });
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
    onFilterChange?.([]);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700 focus:border-monad-500 focus:ring-1 focus:ring-monad-500/30 text-white font-light text-sm outline-none transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                onSearch('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-50 shadow-lg"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 font-light hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0"
                >
                  <Search className="w-3 h-3 inline mr-2 text-zinc-500" />
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-light">Filters</p>
            {selectedFilters.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-monad-400 hover:text-monad-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterToggle(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-all ${
                  selectedFilters.includes(filter.id)
                    ? 'bg-monad-500/20 border border-monad-500/30 text-monad-300'
                    : 'bg-zinc-900/50 border border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
