'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { stockService } from '@/services/stockService';
import { aiService } from '@/services/aiService';
import { watchlistService } from '@/services/watchlistService';
import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TrendingUp, TrendingDown, Bookmark, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function StockDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-overview', ticker],
    queryFn: () => stockService.getOverview(ticker),
  });

  const { data: isInWatchlist, refetch: refetchWatchlist } = useQuery({
    queryKey: ['watchlist-check', ticker],
    queryFn: () => watchlistService.checkWatchlist(ticker),
    enabled: isAuthenticated,
  });

  const { data: aiAnalysis, isLoading: isAnalyzing, refetch: refetchAnalysis } = useQuery({
    queryKey: ['ai-analysis', ticker, aiQuery],
    queryFn: () => aiService.analyzeStock(ticker, aiQuery),
    enabled: showAIAnalysis,
  });

  const handleAddToWatchlist = async () => {
    try {
      await watchlistService.addToWatchlist(ticker);
      toast.success('Added to watchlist');
      refetchWatchlist();
    } catch (error) {
      toast.error('Failed to add to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async () => {
    try {
      await watchlistService.removeFromWatchlist(ticker);
      toast.success('Removed from watchlist');
      refetchWatchlist();
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Stock not found</h2>
        </div>
      </div>
    );
  }

  const { company, quote, financials, overview } = stockData;
  const isPositive = quote.change >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{company.ticker}</h1>
          <p className="text-xl text-gray-600">{company.name}</p>
          {company.sector && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              {company.sector}
            </span>
          )}
        </div>

        {isAuthenticated && (
          <button
            onClick={isInWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
            className={`btn ${isInWatchlist ? 'btn-secondary' : 'btn-primary'}`}
          >
            <Bookmark className={`h-5 w-5 mr-2 ${isInWatchlist ? 'fill-current' : ''}`} />
            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">${quote.price.toFixed(2)}</div>
                <div
                  className={`text-lg font-medium mt-1 ${
                    isPositive ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {isPositive ? <TrendingUp className="inline h-5 w-5" /> : <TrendingDown className="inline h-5 w-5" />}
                  {isPositive ? '+' : ''}${quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {quote.change_percent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-sm text-gray-500">Open</div>
                <div className="text-lg font-semibold text-gray-900">${quote.open.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Volume</div>
                <div className="text-lg font-semibold text-gray-900">{quote.volume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">High</div>
                <div className="text-lg font-semibold text-gray-900">${quote.high.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Low</div>
                <div className="text-lg font-semibold text-gray-900">${quote.low.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {financials?.pe_ratio && (
                <div>
                  <div className="text-sm text-gray-500">P/E Ratio</div>
                  <div className="text-xl font-semibold text-gray-900">{financials.pe_ratio.toFixed(2)}</div>
                </div>
              )}
              {financials?.eps && (
                <div>
                  <div className="text-sm text-gray-500">EPS</div>
                  <div className="text-xl font-semibold text-gray-900">${financials.eps.toFixed(2)}</div>
                </div>
              )}
              {financials?.revenue_growth && (
                <div>
                  <div className="text-sm text-gray-500">Revenue Growth</div>
                  <div className="text-xl font-semibold text-gray-900">{financials.revenue_growth.toFixed(2)}%</div>
                </div>
              )}
              {financials?.roe && (
                <div>
                  <div className="text-sm text-gray-500">ROE</div>
                  <div className="text-xl font-semibold text-gray-900">{financials.roe.toFixed(2)}%</div>
                </div>
              )}
              {financials?.debt_to_equity && (
                <div>
                  <div className="text-sm text-gray-500">Debt to Equity</div>
                  <div className="text-xl font-semibold text-gray-900">{financials.debt_to_equity.toFixed(2)}</div>
                </div>
              )}
              {financials?.profit_margin && (
                <div>
                  <div className="text-sm text-gray-500">Profit Margin</div>
                  <div className="text-xl font-semibold text-gray-900">{financials.profit_margin.toFixed(2)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask a question about this stock..."
                className="input"
              />
            </div>

            <button
              onClick={() => {
                setShowAIAnalysis(true);
                refetchAnalysis();
              }}
              className="w-full btn btn-primary"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Get AI Insights'}
            </button>

            {aiAnalysis && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Valuation Summary</h3>
                  <p className="text-gray-700">{aiAnalysis.valuation_summary}</p>
                </div>

                {aiAnalysis.growth_signals.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Growth Signals</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {aiAnalysis.growth_signals.map((signal, i) => (
                        <li key={i}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.risks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Risks</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {aiAnalysis.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recommendation</h3>
                  <p className="text-gray-700">{aiAnalysis.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
