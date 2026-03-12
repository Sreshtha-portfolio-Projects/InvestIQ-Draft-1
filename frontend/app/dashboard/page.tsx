'use client';

import { useQuery } from '@tanstack/react-query';
import { marketService } from '@/services/marketService';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockCard from '@/components/StockCard';
import SearchBar from '@/components/SearchBar';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-dashboard'],
    queryFn: () => marketService.getDashboard(),
  });

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Dashboard</h1>
        <p className="text-gray-600">Real-time market data and AI-powered insights</p>
      </div>

      <div className="mb-8">
        <SearchBar />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {marketData?.indices.map((index) => (
          <div key={index.symbol} className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{index.name}</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {index.value.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  index.change >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {index.change >= 0 ? '+' : ''}
                {index.change.toFixed(2)} ({index.change >= 0 ? '+' : ''}
                {index.change_percent.toFixed(2)}%)
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success-600" />
            <h2 className="text-xl font-bold text-gray-900">Top Gainers</h2>
          </div>
          <div className="space-y-4">
            {marketData?.top_gainers.slice(0, 5).map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                price={stock.price}
                change={stock.change_amount}
                changePercent={parseFloat(stock.change_percentage.replace('%', ''))}
                onClick={() => router.push(`/stocks/${stock.ticker}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="h-5 w-5 text-danger-600" />
            <h2 className="text-xl font-bold text-gray-900">Top Losers</h2>
          </div>
          <div className="space-y-4">
            {marketData?.top_losers.slice(0, 5).map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                price={stock.price}
                change={stock.change_amount}
                changePercent={parseFloat(stock.change_percentage.replace('%', ''))}
                onClick={() => router.push(`/stocks/${stock.ticker}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Most Active</h2>
          </div>
          <div className="space-y-4">
            {marketData?.most_active.slice(0, 5).map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                price={stock.price}
                change={stock.change_amount}
                changePercent={parseFloat(stock.change_percentage.replace('%', ''))}
                onClick={() => router.push(`/stocks/${stock.ticker}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
