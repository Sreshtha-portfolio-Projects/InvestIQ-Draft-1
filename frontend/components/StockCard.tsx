'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockCardProps {
  ticker: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  onClick?: () => void;
}

export default function StockCard({
  ticker,
  name,
  price,
  change,
  changePercent,
  onClick,
}: StockCardProps) {
  const isPositive = change >= 0;

  return (
    <button
      onClick={onClick}
      className="card hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{ticker}</h3>
          {name && <p className="text-sm text-gray-500 mt-1">{name}</p>}
        </div>
        {isPositive ? (
          <TrendingUp className="h-5 w-5 text-success-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-danger-500" />
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">
          ${price.toFixed(2)}
        </div>
        <div
          className={`text-sm font-medium mt-1 ${
            isPositive ? 'text-success-600' : 'text-danger-600'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)} ({isPositive ? '+' : ''}
          {changePercent.toFixed(2)}%)
        </div>
      </div>
    </button>
  );
}
