'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useStockSearch } from '@/hooks/useStocks';
import { useDebounce } from '@/hooks/useDebounce';
import { Company } from '@/types';

export const StockSearchBar = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useStockSearch(debouncedQuery);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: Company) => {
    setQuery('');
    setOpen(false);
    router.push(`/stocks/${company.ticker}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search stocks… (TCS, INFY, RELIANCE)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {open && query.length >= 1 && (
        <div className="absolute top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
          )}
          {!isLoading && results && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No results for &quot;{query}&quot;</div>
          )}
          {!isLoading && results && results.length > 0 && (
            <ul>
              {results.map((company) => (
                <li key={company.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-left transition-colors"
                    onClick={() => handleSelect(company)}
                  >
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-300">
                        {company.ticker.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{company.name}</p>
                      <p className="text-xs text-slate-400">{company.ticker} · {company.sector}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
