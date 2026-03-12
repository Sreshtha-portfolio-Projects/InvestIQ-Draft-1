export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  market_cap?: number;
}

export interface Financials {
  company_id: string;
  pe_ratio: number;
  eps: number;
  revenue_growth: number;
  roe: number;
  debt_to_equity: number;
  year: number;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  company_id: string;
  company?: Company;
}

export interface EarningsTranscript {
  id: string;
  company_id: string;
  quarter: string;
  transcript_text: string;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
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

export interface AIResearchResponse {
  valuation_summary: string;
  growth_signals: string[];
  risks: string[];
  recommendation: string;
  confidence_score: number;
}

export interface ScreenerFilters {
  max_pe?: number;
  min_revenue_growth?: number;
  max_debt_to_equity?: number;
  sector?: string;
  min_roe?: number;
  market_cap_category?: 'small' | 'mid' | 'large';
}

export interface EarningsAnalysis {
  growth_signals: string[];
  risk_signals: string[];
  management_sentiment: 'positive' | 'neutral' | 'negative';
  key_strategic_initiatives: string[];
  summary: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
