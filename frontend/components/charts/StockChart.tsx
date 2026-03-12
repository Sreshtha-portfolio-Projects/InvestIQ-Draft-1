'use client';

import { useEffect, useRef, useState } from 'react';
import { PricePoint } from '@/types';
import { cn } from '@/utils/cn';

interface StockChartProps {
  data: PricePoint[];
  ticker: string;
  currentPrice?: number;
  priceChange?: number;
}

type Range = '1W' | '1M' | '3M' | 'ALL';

const RANGE_DAYS: Record<Range, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  'ALL': 9999,
};

export const StockChart = ({ data, ticker, currentPrice, priceChange = 0 }: StockChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<Range>('3M');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  const filteredData = data.slice(-RANGE_DAYS[range]);
  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? '#34d399' : '#f87171';

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || filteredData.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const prices = filteredData.map((d) => d.close);
    const minPrice = Math.min(...prices) * 0.995;
    const maxPrice = Math.max(...prices) * 1.005;
    const priceRange = maxPrice - minPrice;

    const padding = { top: 20, right: 16, bottom: 32, left: 56 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y axis labels
      const price = maxPrice - (priceRange * i) / 4;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${price.toFixed(0)}`, padding.left - 6, y + 4);
    }

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${lineColor}30`);
    gradient.addColorStop(1, `${lineColor}00`);

    // Draw fill area
    ctx.beginPath();
    filteredData.forEach((point, i) => {
      const x = padding.left + (i / (filteredData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.close - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    filteredData.forEach((point, i) => {
      const x = padding.left + (i / (filteredData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.close - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X-axis date labels
    const labelCount = Math.min(4, filteredData.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / (labelCount - 1)) * (filteredData.length - 1));
      const point = filteredData[idx];
      const x = padding.left + (idx / (filteredData.length - 1)) * chartWidth;
      const date = new Date(point.date);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        x,
        height - 8
      );
    }
  }, [filteredData, range, lineColor]);

  return (
    <div className="space-y-3">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['1W', '1M', '3M', 'ALL'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                range === r ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {currentPrice && (
          <div className="text-right">
            <span className="text-lg font-semibold text-white">₹{currentPrice.toFixed(2)}</span>
            <span className={cn('ml-2 text-sm', isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart canvas */}
      <div ref={containerRef} className="w-full relative">
        {filteredData.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
            No price data available
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full" />
        )}
      </div>
    </div>
  );
};
