'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { screenerService } from '@/services/screenerService';
import { Search, Sparkles } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function ScreenerPage() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['screener', searchQuery],
    queryFn: () => screenerService.screen(searchQuery),
    enabled: false,
  });

  const handleSearch = () => {
    setSearchQuery(query);
    refetch();
  };

  const exampleQueries = [
    'Find undervalued tech companies with strong growth',
    'Low debt high ROE companies',
    'Large cap stocks with PE ratio under 20',
    'Mid cap companies with revenue growth over 15%',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Screener</h1>
        <p className="text-gray-600">Use natural language to find stocks matching your criteria</p>
      </div>

      <div className="card mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Natural Language Search</h2>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Find undervalued tech companies with strong growth..."
            className="input flex-1"
          />
          <button onClick={handleSearch} className="btn btn-primary" disabled={isLoading}>
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {results && (
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Results</h2>
            <p className="text-gray-600">{results.description}</p>
            <p className="text-sm text-gray-500 mt-2">Found {results.total} stocks</p>
          </div>

          {results.results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No stocks match your criteria</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Ticker</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Sector</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">P/E Ratio</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Revenue Growth</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">ROE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.results.map((result: any, index: number) => (
                    <tr
                      key={index}
                      onClick={() => router.push(`/stocks/${result.companies?.ticker}`)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.companies?.ticker}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {result.companies?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.companies?.sector}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {result.pe_ratio?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {result.revenue_growth ? `${result.revenue_growth.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {result.roe ? `${result.roe.toFixed(2)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
