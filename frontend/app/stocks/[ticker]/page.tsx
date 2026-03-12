'use client';

import { use, useState } from 'react';
import { BookMarked, BookmarkX, TrendingUp, TrendingDown, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useStockDetail, useAddToWatchlist, useRemoveFromWatchlist, useWatchlist } from '@/hooks/useStocks';
import { StockChart } from '@/components/charts/StockChart';
import { ResearchAssistant } from '@/components/ai/ResearchAssistant';
import { EarningsAnalyzer } from '@/components/ai/EarningsAnalyzer';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatPercent, formatCurrency, getPriceBgColor, getPriceChangeColor } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  highlight?: boolean;
}

const MetricCard = ({ label, value, suffix, highlight }: MetricCardProps) => (
  <div className="bg-slate-800/50 rounded-lg p-3">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={cn('text-base font-semibold', highlight ? 'text-blue-400' : 'text-white')}>
      {value !== null && value !== undefined && value !== '' ? `${value}${suffix || ''}` : '—'}
    </p>
  </div>
);

type TabType = 'overview' | 'ai-research' | 'earnings';

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const { data, isLoading, error } = useStockDetail(ticker.toUpperCase());
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const isInWatchlist = watchlist?.some(
    (item: { companies: { ticker: string } }) => item.companies?.ticker === ticker.toUpperCase()
  );

  const watchlistItem = watchlist?.find(
    (item: { companies: { ticker: string }; company_id: string }) =>
      item.companies?.ticker === ticker.toUpperCase()
  );

  const handleWatchlistToggle = () => {
    if (isInWatchlist && watchlistItem) {
      removeFromWatchlist.mutate(watchlistItem.company_id);
    } else if (data?.company?.id) {
      addToWatchlist.mutate(data.company.id);
    }
  };

  if (isLoading) return <PageLoader label="Loading stock data..." />;

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-lg">Stock &quot;{ticker}&quot; not found</p>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const { company, overview, quote, price_history, financials } = data;
  const isPositive = (quote?.change_percent || 0) >= 0;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai-research', label: 'AI Research' },
    { id: 'earnings', label: 'Earnings Analysis' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300">{ticker.toUpperCase()}</span>
      </div>

      {/* Hero section */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">{ticker.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <Badge variant="default">{ticker.toUpperCase()}</Badge>
              {company.exchange && <Badge variant="info">{company.exchange}</Badge>}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {company.sector} {company.industry ? `· ${company.industry}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleWatchlistToggle}
            loading={addToWatchlist.isPending || removeFromWatchlist.isPending}
          >
            {isInWatchlist ? (
              <><BookmarkX className="w-4 h-4" /> Remove</>
            ) : (
              <><BookMarked className="w-4 h-4" /> Watchlist</>
            )}
          </Button>
        </div>
      </div>

      {/* Price hero */}
      {quote && (
        <div className="flex items-end gap-4 flex-wrap">
          <span className="text-4xl font-bold text-white">₹{quote.price.toFixed(2)}</span>
          <div className={cn('flex items-center gap-1 mb-1', getPriceChangeColor(quote.change_percent))}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-lg font-semibold">{formatPercent(quote.change_percent)}</span>
            <span className="text-sm">({isPositive ? '+' : ''}₹{quote.change.toFixed(2)})</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-1 -mb-px">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
            </CardHeader>
            <StockChart
              data={price_history || []}
              ticker={ticker.toUpperCase()}
              currentPrice={quote?.price}
              priceChange={quote?.change_percent}
            />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Data */}
            <Card>
              <CardHeader>
                <CardTitle>Market Data</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Current Price" value={quote?.price ? `₹${quote.price.toFixed(2)}` : null} />
                <MetricCard
                  label="52W High"
                  value={overview?.['52WeekHigh'] ? `₹${overview['52WeekHigh']}` : quote?.week_52_high ? `₹${quote.week_52_high}` : null}
                />
                <MetricCard
                  label="52W Low"
                  value={overview?.['52WeekLow'] ? `₹${overview['52WeekLow']}` : quote?.week_52_low ? `₹${quote.week_52_low}` : null}
                />
                <MetricCard label="Volume" value={quote?.volume ? quote.volume.toLocaleString('en-IN') : null} />
                <MetricCard label="Beta" value={overview?.['Beta'] as string} />
                <MetricCard label="Dividend Yield" value={overview?.['DividendYield'] ? `${(parseFloat(overview['DividendYield'] as string) * 100).toFixed(2)}%` : null} />
              </div>
            </Card>

            {/* Fundamentals */}
            <Card>
              <CardHeader>
                <CardTitle>Fundamentals</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="P/E Ratio"
                  value={financials?.pe_ratio || overview?.['PERatio'] as string}
                  highlight
                />
                <MetricCard
                  label="EPS"
                  value={financials?.eps ? `₹${financials.eps}` : overview?.['EPS'] ? `₹${overview['EPS']}` : null}
                />
                <MetricCard
                  label="Revenue Growth"
                  value={financials?.revenue_growth ? `${financials.revenue_growth}%` : null}
                  highlight
                />
                <MetricCard
                  label="ROE"
                  value={financials?.roe ? `${financials.roe}%` : null}
                />
                <MetricCard
                  label="Debt/Equity"
                  value={financials?.debt_to_equity}
                />
                <MetricCard
                  label="Market Cap"
                  value={overview?.['MarketCapitalization']
                    ? formatCurrency(parseInt(overview['MarketCapitalization'] as string))
                    : null}
                />
              </div>
            </Card>
          </div>

          {/* Company Description */}
          {overview?.['Description'] && (
            <Card>
              <CardHeader>
                <CardTitle>About {company.name}</CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-300 leading-relaxed">{overview['Description'] as string}</p>
            </Card>
          )}
        </div>
      )}

      {/* AI Research Tab */}
      {activeTab === 'ai-research' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" style={{ height: '600px' }}>
          <ResearchAssistant defaultTicker={ticker.toUpperCase()} />
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && company.id && (
        <EarningsAnalyzer companyId={company.id} companyName={company.name} />
      )}
    </div>
  );
}
