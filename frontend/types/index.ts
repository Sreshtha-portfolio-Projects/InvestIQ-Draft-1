export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Company {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  market_cap: number;
  description?: string;
}

export interface Financial {
  id: string;
  company_id: string;
  year: number;
  quarter?: number;
  pe_ratio?: number;
  eps?: number;
  revenue_growth?: number;
  roe?: number;
  debt_to_equity?: number;
  current_ratio?: number;
  profit_margin?: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  week_52_high?: number;
  week_52_low?: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_percent: number;
}

export interface MarketMover {
  ticker: string;
  price: number;
  change_amount: number;
  change_percentage: string;
  volume: number;
}

export interface StockOverview {
  company: Company;
  overview: any;
  quote: StockQuote;
  financials: Financial;
}

export interface AIAnalysis {
  ticker: string;
  valuation_summary: string;
  growth_signals: string[];
  risks: string[];
  recommendation: string;
  confidence_level: string;
}

export interface StockComparison {
  comparison_summary: string;
  ticker1_strengths: string[];
  ticker2_strengths: string[];
  recommendation: string;
}

export interface ScreenerFilters {
  pe_ratio?: { min?: number; max?: number };
  market_cap?: { min?: number; max?: number };
  revenue_growth?: { min?: number };
  roe?: { min?: number };
  debt_to_equity?: { max?: number };
  sector?: string;
}

export interface ScreenerResult {
  description: string;
  filters: ScreenerFilters;
  results: any[];
  total: number;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  company_id: string;
  companies: Company;
  created_at: string;
}

export interface EarningsTranscript {
  id: string;
  company_id: string;
  quarter: string;
  year: number;
  transcript_text: string;
  created_at: string;
}

export interface EarningsAnalysis {
  company_id: string;
  quarter: string;
  growth_signals: string[];
  risk_signals: string[];
  management_sentiment: string;
  key_initiatives: string[];
  summary: string;
}

export interface ChartDataPoint {
  timestamp?: string;
  date?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
