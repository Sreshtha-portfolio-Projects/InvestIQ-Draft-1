'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Filter, TrendingUp, ArrowRight, Lightbulb } from 'lucide-react';
import { useStockScreener } from '@/hooks/useStocks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ScreenerResult, Company } from '@/types';
import { cn } from '@/utils/cn';

const EXAMPLE_QUERIES = [
  { label: 'Undervalued IT stocks', query: 'Find undervalued IT companies with strong growth' },
  { label: 'Low debt banks', query: 'Banking stocks with low debt and high ROE' },
  { label: 'High growth midcap', query: 'Midcap companies with high revenue growth' },
  { label: 'FMCG dividend', query: 'FMCG companies with consistent dividends' },
  { label: 'Small cap pharma', query: 'Small cap pharmaceutical companies with strong pipeline' },
  { label: 'Undervalued auto', query: 'Automobile stocks trading below industry PE' },
];

interface FilterBadgeProps {
  label: string;
  value: string | number | null | undefined;
}

const FilterBadge = ({ label, value }: FilterBadgeProps) => {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-400/10 border border-blue-400/20 rounded-full text-xs text-blue-300">
      <Filter className="w-2.5 h-2.5" />
      {label}: {value}
    </span>
  );
};

interface CompanyResultCardProps {
  company: Company & { financials?: { pe_ratio?: number; revenue_growth?: number; roe?: number; debt_to_equity?: number }[] };
}

const CompanyResultCard = ({ company }: CompanyResultCardProps) => {
  const fin = company.financials?.[0];
  return (
    <Link
      href={`/stocks/${company.ticker}`}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-400">{company.ticker.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{company.name}</p>
            <p className="text-xs text-slate-500">{company.ticker} · {company.sector}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600" />
      </div>

      {fin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800">
          {fin.pe_ratio && (
            <div>
              <p className="text-xs text-slate-600">P/E</p>
              <p className="text-sm font-medium text-white">{fin.pe_ratio.toFixed(1)}</p>
            </div>
          )}
          {fin.revenue_growth && (
            <div>
              <p className="text-xs text-slate-600">Revenue Growth</p>
              <p className="text-sm font-medium text-emerald-400">{fin.revenue_growth.toFixed(1)}%</p>
            </div>
          )}
          {fin.roe && (
            <div>
              <p className="text-xs text-slate-600">ROE</p>
              <p className="text-sm font-medium text-white">{fin.roe.toFixed(1)}%</p>
            </div>
          )}
          {fin.debt_to_equity && (
            <div>
              <p className="text-xs text-slate-600">D/E Ratio</p>
              <p className="text-sm font-medium text-white">{fin.debt_to_equity.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

export default function ScreenerPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { mutate: screen, isPending, data: result, error } = useStockScreener();

  const handleSubmit = (q?: string) => {
    const searchQuery = q || query.trim();
    if (!searchQuery) return;
    setSubmitted(searchQuery);
    screen(searchQuery);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">AI-Powered Natural Language Screener</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Find Your Next Investment</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          Describe what you&apos;re looking for in plain English. Our AI interprets your query and screens
          the market for matching stocks.
        </p>
      </div>

      {/* Search bar */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Undervalued midcap IT companies with strong growth and low debt..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
          />
          <Button onClick={() => handleSubmit()} loading={isPending} disabled={!query.trim()}>
            Screen
          </Button>
        </div>

        {/* Example queries */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-500">Try these examples:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(({ label, query: q }) => (
              <button
                key={label}
                onClick={() => { setQuery(q); handleSubmit(q); }}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-sm text-red-400">
          {error instanceof Error ? error.message : 'Screening failed. Please try again.'}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Interpretation */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-blue-100">{result.interpretation}</p>
                <div className="flex flex-wrap gap-2">
                  <FilterBadge label="Max P/E" value={result.applied_filters?.max_pe as string | number | null} />
                  <FilterBadge label="Min Revenue Growth" value={result.applied_filters?.min_revenue_growth ? `${result.applied_filters.min_revenue_growth}%` : null} />
                  <FilterBadge label="Max D/E" value={result.applied_filters?.max_debt_to_equity as string | number | null} />
                  <FilterBadge label="Sector" value={result.applied_filters?.sector as string} />
                  <FilterBadge label="Min ROE" value={result.applied_filters?.min_roe ? `${result.applied_filters.min_roe}%` : null} />
                  <FilterBadge label="Market Cap" value={result.applied_filters?.market_cap_category as string} />
                </div>
              </div>
            </div>
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {result.total_count} {result.total_count === 1 ? 'stock' : 'stocks'} found
              {submitted && <span className="text-slate-400 font-normal text-sm ml-2">for &quot;{submitted}&quot;</span>}
            </h2>
          </div>

          {/* Companies grid */}
          {result.companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.companies.map((company) => (
                <CompanyResultCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No stocks matched your criteria.</p>
              <p className="text-sm text-slate-600 mt-1">Try adjusting your query or using different filters.</p>
              {result.suggestions?.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {result.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(s); handleSubmit(s); }}
                      className="text-xs px-3 py-1.5 bg-slate-800 rounded-full text-blue-400 hover:bg-slate-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Assistant */}
      {!result && !isPending && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
          <TrendingUp className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">How the AI Screener Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-left">
            {[
              { step: '1', title: 'Write in Plain English', desc: 'Describe stocks you want in natural language' },
              { step: '2', title: 'AI Interprets Filters', desc: 'Gemini converts your query to database filters' },
              { step: '3', title: 'Get Matching Stocks', desc: 'See stocks that match your exact criteria' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-slate-800/50 rounded-lg p-4">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2">
                  {step}
                </div>
                <p className="text-sm font-medium text-white mb-1">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
