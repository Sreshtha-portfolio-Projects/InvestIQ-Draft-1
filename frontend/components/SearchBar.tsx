'use client';

import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => stockService.search(query),
    enabled: query.length > 0,
  });

  const handleSelect = (ticker: string) => {
    router.push(`/stocks/${ticker}`);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stocks..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}

          {results && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}

          {results && results.length > 0 && (
            <div className="py-2">
              {results.map((result: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result.ticker)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left transition"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{result.ticker}</div>
                    <div className="text-sm text-gray-500">{result.name}</div>
                  </div>
                  {result.sector && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {result.sector}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
