'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight, BarChart2, Star, Sparkles } from 'lucide-react';
import { useMarketDashboard } from '@/hooks/useStocks';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { StockQuote, MarketIndex } from '@/types';
import { formatPercent, formatCurrency, getPriceBgColor } from '@/utils/format';
import { cn } from '@/utils/cn';

const IndexCard = ({ index }: { index: MarketIndex }) => {
  const isPositive = index.change_percent >= 0;
  return (
    <Card className="flex-1 min-w-[160px]">
      <p className="text-xs text-slate-500 mb-1">{index.name}</p>
      <p className="text-xl font-bold text-white">{index.value.toLocaleString('en-IN')}</p>
      <div className={cn('flex items-center gap-1 mt-1', isPositive ? 'text-emerald-400' : 'text-red-400')}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span className="text-sm font-medium">{formatPercent(index.change_percent)}</span>
        <span className="text-xs text-slate-500">({isPositive ? '+' : ''}{index.change.toFixed(2)})</span>
      </div>
    </Card>
  );
};

const StockRow = ({ stock, rank }: { stock: StockQuote; rank: number }) => {
  const isPositive = stock.change_percent >= 0;
  return (
    <Link href={`/stocks/${stock.ticker}`} className="flex items-center gap-3 py-3 hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors">
      <span className="text-xs text-slate-600 w-4 shrink-0">{rank}</span>
      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-slate-400">{stock.ticker.slice(0, 2)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{stock.ticker}</p>
        <p className="text-xs text-slate-500">₹{stock.price.toFixed(2)}</p>
      </div>
      <span className={cn('text-sm font-semibold px-2 py-0.5 rounded', getPriceBgColor(stock.change_percent))}>
        {formatPercent(stock.change_percent)}
      </span>
    </Link>
  );
};

const FeaturedTicker = ({ stock }: { stock: StockQuote }) => {
  const isPositive = stock.change_percent >= 0;
  return (
    <Link
      href={`/stocks/${stock.ticker}`}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-slate-400">{stock.ticker.slice(0, 2)}</span>
        </div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', getPriceBgColor(stock.change_percent))}>
          {formatPercent(stock.change_percent)}
        </span>
      </div>
      <p className="text-sm font-semibold text-white">{stock.ticker}</p>
      <p className="text-lg font-bold text-white mt-1">₹{stock.price.toFixed(2)}</p>
    </Link>
  );
};

export default function DashboardPage() {
  const { data, isLoading, error } = useMarketDashboard();

  if (isLoading) return <PageLoader label="Loading market data..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/screener"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI Screener
        </Link>
      </div>

      {/* Market Indices */}
      {data?.indices && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Indices</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.indices.map((index) => (
              <IndexCard key={index.name} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Trending stocks */}
      {data?.trending && data.trending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Trending</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.trending.map((stock) => (
              <FeaturedTicker key={stock.ticker} stock={stock} />
            ))}
          </div>
        </div>
      )}

      {/* Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Gainers</CardTitle>
            <Badge variant="success">Today</Badge>
          </CardHeader>
          {data?.top_gainers?.length ? (
            <div className="divide-y divide-slate-800/50">
              {data.top_gainers.map((stock, i) => (
                <StockRow key={stock.ticker} stock={stock} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">No data available</p>
          )}
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Losers</CardTitle>
            <Badge variant="danger">Today</Badge>
          </CardHeader>
          {data?.top_losers?.length ? (
            <div className="divide-y divide-slate-800/50">
              {data.top_losers.map((stock, i) => (
                <StockRow key={stock.ticker} stock={stock} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">No data available</p>
          )}
        </Card>
      </div>

      {/* AI Research CTA */}
      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">AI Research Assistant</h3>
            <p className="text-sm text-slate-300 mb-4">
              Ask anything about Indian stocks — valuations, comparisons, growth analysis, earnings insights.
              Powered by Google Gemini.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'Is TCS undervalued?',
                'Compare INFY vs WIPRO',
                'Best banking stocks?',
              ].map((q) => (
                <Link
                  key={q}
                  href={`/screener?q=${encodeURIComponent(q)}`}
                  className="text-xs px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  &quot;{q}&quot;
                </Link>
              ))}
            </div>
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Open AI Screener <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
