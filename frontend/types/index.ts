export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  industry?: string;
  market_cap?: number;
  description?: string;
  exchange?: string;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  week_52_high?: number;
  week_52_low?: number;
  pe_ratio?: number;
  eps?: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  change_percent: number;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Financials {
  pe_ratio?: number;
  eps?: number;
  revenue_growth?: number;
  roe?: number;
  debt_to_equity?: number;
  year?: number;
}

export interface StockDetail {
  company: Company;
  overview: Record<string, string> | null;
  quote: StockQuote | null;
  price_history: PricePoint[];
  financials: Financials | null;
}

export interface AIResearchResponse {
  valuation_summary: string;
  growth_signals: string[];
  risks: string[];
  recommendation: string;
  confidence_score: number;
  detailed_analysis: string;
  ticker?: string;
  company_name?: string;
  key_metrics_interpretation?: {
    pe_assessment: string;
    growth_assessment: string;
    debt_assessment: string;
  };
}

export interface ScreenerResult {
  companies: (Company & { financials?: Financials[] })[];
  applied_filters: Record<string, unknown>;
  interpretation: string;
  suggestions: string[];
  total_count: number;
}

export interface EarningsAnalysis {
  growth_signals: string[];
  risk_signals: string[];
  management_sentiment: 'positive' | 'neutral' | 'negative';
  key_strategic_initiatives: string[];
  guidance: {
    revenue: string | null;
    margins: string | null;
    capex: string | null;
  };
  summary: string;
  sentiment_justification: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  company_id: string;
  added_at: string;
  companies: Company;
  quote?: StockQuote;
}

export interface MarketDashboard {
  indices: MarketIndex[];
  top_gainers: StockQuote[];
  top_losers: StockQuote[];
  trending: StockQuote[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: AIResearchResponse;
}
