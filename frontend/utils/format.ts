export const formatCurrency = (value: number, currency = 'INR'): string => {
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, decimals = 2): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return value.toFixed(decimals);
};

export const formatPercent = (value: number, showSign = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatLargeNumber = (value: number): string => {
  return new Intl.NumberFormat('en-IN').format(value);
};

export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-red-400';
  return 'text-slate-400';
};

export const getPriceBgColor = (change: number): string => {
  if (change > 0) return 'bg-emerald-400/10 text-emerald-400';
  if (change < 0) return 'bg-red-400/10 text-red-400';
  return 'bg-slate-400/10 text-slate-400';
};

export const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'text-emerald-400';
    case 'negative': return 'text-red-400';
    default: return 'text-amber-400';
  }
};

export const getRecommendationColor = (rec: string): string => {
  const upper = rec.toUpperCase();
  if (upper.includes('BUY') || upper.includes('STRONG BUY')) return 'text-emerald-400 bg-emerald-400/10';
  if (upper.includes('SELL') || upper.includes('STRONG SELL')) return 'text-red-400 bg-red-400/10';
  return 'text-amber-400 bg-amber-400/10';
};
