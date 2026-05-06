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

export interface ScreenerFiltersShape {
  max_pe?: number;
  min_revenue_growth?: number;
  max_debt_to_equity?: number;
  sector?: string;
  min_roe?: number;
  market_cap_category?: 'small' | 'mid' | 'large' | null;
}

export interface ScreenerResult {
  companies: (Company & { financials?: Financials[] })[];
  applied_filters: ScreenerFiltersShape & Record<string, unknown>;
  interpretation?: string;
  insights: string;
  warnings: string[];
  relaxed_filters?: ScreenerFiltersShape;
  reason_for_relaxation?: string;
  alternative_strategies?: string[];
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

export type QueryIntentMode =
  | 'SCREENER'
  | 'STOCK_ANALYSIS'
  | 'VALUATION_ANALYSIS'
  | 'COMPARISON'
  | 'UNKNOWN';

export type IntentConfidence = 'high' | 'medium' | 'low';

export interface IntentEntities {
  companies: string[];
  sector: string | null;
  metrics: string[];
}

export interface IntentClassificationResult {
  mode: QueryIntentMode;
  entities: IntentEntities;
  confidence: IntentConfidence;
}

export interface ResearchAssistantResult {
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

export interface ValuationAnalysisResult {
  valuation_verdict: string;
  vs_peers: string;
  vs_history: string;
  fair_value_reasoning: string;
  risks: string[];
  recommendation: string;
  confidence_score: number;
  detailed_analysis: string;
  key_metrics_interpretation: {
    pe_vs_sector: string;
    multiple_summary: string;
  };
  ticker?: string;
  company_name?: string;
}

export interface ComparisonEngineResult {
  winner: string;
  valuation_comparison: string;
  growth_comparison: string;
  quality_comparison: string;
  recommendation: Record<string, string>;
  summary: string;
}

export type RoutedAiResponse =
  | { mode: 'SCREENER'; intent: IntentClassificationResult; result: ScreenerResult }
  | { mode: 'VALUATION_ANALYSIS'; intent: IntentClassificationResult; result: ValuationAnalysisResult }
  | { mode: 'STOCK_ANALYSIS'; intent: IntentClassificationResult; result: ResearchAssistantResult }
  | { mode: 'COMPARISON'; intent: IntentClassificationResult; result: ComparisonEngineResult }
  | { mode: 'UNKNOWN'; intent: IntentClassificationResult; result: null; message: string };

export type RelativeVerdict = 'undervalued' | 'fairly_valued' | 'overvalued';

export interface RelativeValuationInput {
  company_name: string;
  current_pe: number;
  historical_pe_range: { min: number; max: number };
  historical_median_pe: number;
  peer_pe_range?: { min: number; max: number };
  revenue_growth: number;
  roe: number;
  sector: string;
}

export interface RelativeValuationResult {
  verdict: RelativeVerdict;
  score: number;
  score_breakdown: {
    historical_pe_score: number;
    peer_comparison_score: number;
    growth_adjustment: number;
    roe_quality_score: number;
  };
  confidence: 'high' | 'medium' | 'low';
  analysis: {
    current_pe: number;
    historical_range: string;
    historical_median: number;
    relative_position: 'below average' | 'near average' | 'above average';
  };
  reasoning: string[];
  insight: string;
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
