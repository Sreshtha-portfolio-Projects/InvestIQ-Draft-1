'use client';

import Link from 'next/link';
import { BookMarked, Trash2, TrendingUp, TrendingDown, Plus, ArrowRight } from 'lucide-react';
import { useWatchlist, useRemoveFromWatchlist } from '@/hooks/useStocks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { WatchlistItem, StockQuote } from '@/types';
import { formatPercent, getPriceBgColor } from '@/utils/format';
import { cn } from '@/utils/cn';

interface WatchlistRowProps {
  item: WatchlistItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const WatchlistRow = ({ item, onRemove, isRemoving }: WatchlistRowProps) => {
  const quote = item.quote;
  const company = item.companies;
  const isPositive = (quote?.change_percent || 0) >= 0;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-800 last:border-0 group">
      {/* Company info */}
      <Link href={`/stocks/${company.ticker}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-slate-400">{company.ticker.slice(0, 2)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
            {company.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{company.ticker}</span>
            {company.sector && (
              <Badge variant="default" className="text-xs">{company.sector}</Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Price data */}
      {quote ? (
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-white">₹{quote.price.toFixed(2)}</p>
          <div className={cn('flex items-center justify-end gap-1 mt-0.5', isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">{formatPercent(quote.change_percent)}</span>
          </div>
        </div>
      ) : (
        <div className="text-right shrink-0">
          <p className="text-sm text-slate-600">—</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/stocks/${company.ticker}`}>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.company_id)}
          loading={isRemoving}
          className="text-slate-500 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default function WatchlistPage() {
  const { data: watchlist, isLoading } = useWatchlist();
  const { mutate: remove, isPending: isRemoving, variables: removingId } = useRemoveFromWatchlist();

  if (isLoading) return <PageLoader label="Loading watchlist..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-blue-400" />
            My Watchlist
          </h1>
          {watchlist && watchlist.length > 0 && (
            <p className="text-sm text-slate-400 mt-1">{watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'} tracked</p>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4" />
            Add Stocks
          </Button>
        </Link>
      </div>

      {/* Watchlist */}
      {watchlist && watchlist.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3 border-b border-slate-800 hidden sm:flex items-center gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</span>
            </div>
            <div className="text-right shrink-0 w-24">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</span>
            </div>
            <div className="shrink-0 w-16" />
          </div>

          <div className="px-5">
            {watchlist.map((item) => (
              <WatchlistRow
                key={item.id}
                item={item as WatchlistItem}
                onRemove={(id) => remove(id)}
                isRemoving={isRemoving && removingId === item.company_id}
              />
            ))}
          </div>
        </Card>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            Start tracking stocks you&apos;re interested in. Browse the market or search for specific stocks.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button>Browse Market</Button>
            </Link>
            <Link href="/screener">
              <Button variant="secondary">
                Use AI Screener
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {watchlist && watchlist.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Gainers Today',
              value: watchlist.filter((i) => (i.quote?.change_percent || 0) > 0).length,
              color: 'text-emerald-400',
            },
            {
              label: 'Losers Today',
              value: watchlist.filter((i) => (i.quote?.change_percent || 0) < 0).length,
              color: 'text-red-400',
            },
            {
              label: 'Unchanged',
              value: watchlist.filter((i) => (i.quote?.change_percent || 0) === 0 || !i.quote).length,
              color: 'text-slate-400',
            },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center">
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
