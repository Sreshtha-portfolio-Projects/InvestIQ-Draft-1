'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { watchlistService } from '@/services/watchlistService';
import { stockService } from '@/services/stockService';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockCard from '@/components/StockCard';
import { Bookmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WatchlistPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistService.getWatchlist(),
    enabled: isAuthenticated,
  });

  const handleRemove = async (ticker: string) => {
    try {
      await watchlistService.removeFromWatchlist(ticker);
      toast.success('Removed from watchlist');
      refetch();
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Bookmark className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Watchlist</h1>
        </div>
        <p className="text-gray-600">Track your favorite stocks</p>
      </div>

      {!watchlist || watchlist.length === 0 ? (
        <div className="card text-center py-12">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h2>
          <p className="text-gray-600 mb-6">Start adding stocks to track them here</p>
          <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
            Explore Stocks
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item: any) => (
            <div key={item.id} className="relative">
              <WatchlistStockCard
                ticker={item.companies.ticker}
                name={item.companies.name}
                onClick={() => router.push(`/stocks/${item.companies.ticker}`)}
              />
              <button
                onClick={() => handleRemove(item.companies.ticker)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistStockCard({
  ticker,
  name,
  onClick,
}: {
  ticker: string;
  name: string;
  onClick: () => void;
}) {
  const { data: quote } = useQuery({
    queryKey: ['quote', ticker],
    queryFn: () => stockService.getQuote(ticker),
  });

  if (!quote) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900">{ticker}</h3>
        <p className="text-sm text-gray-500">{name}</p>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <StockCard
      ticker={ticker}
      name={name}
      price={quote.price}
      change={quote.change}
      changePercent={quote.change_percent}
      onClick={onClick}
    />
  );
}
