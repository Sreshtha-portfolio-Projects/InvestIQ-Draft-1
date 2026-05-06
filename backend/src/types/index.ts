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
  market_cap_category?: 'small' | 'mid' | 'large' | null;
}

/** Payload returned inside ApiResponse.data for POST /ai/screen */
export interface StockScreenResult {
  companies: Company[];
  applied_filters: ScreenerFilters;
  /** Present when NL interpretation is used */
  interpretation?: string;
  /** Analyst-style narrative (screening outcome and context) */
  insights: string;
  warnings: string[];
  relaxed_filters?: ScreenerFilters;
  reason_for_relaxation?: string;
  alternative_strategies?: string[];
  /** Legacy NL refinement suggestions from the interpreter */
  suggestions: string[];
  total_count: number;
}

export interface EarningsAnalysis {
  growth_signals: string[];
  risk_signals: string[];
  management_sentiment: 'positive' | 'neutral' | 'negative';
  key_strategic_initiatives: string[];
  summary: string;
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

/** Intent classifier output (strict JSON contract for `/ai/intent`) */
export interface IntentClassificationResult {
  mode: QueryIntentMode;
  entities: IntentEntities;
  confidence: IntentConfidence;
}

/** POST `/api/ai/research` payload shape */
export interface ResearchAssistantResult {
  valuation_summary: string;
  growth_signals: string[];
  risks: string[];
  recommendation: string;
  confidence_score: number;
  detailed_analysis: string;
  key_metrics_interpretation: {
    pe_assessment: string;
    growth_assessment: string;
    debt_assessment: string;
  };
  ticker?: string;
  company_name?: string;
}

/** Valuation-focused analysis (intent VALUATION_ANALYSIS) */
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

/** Head-to-head comparison (intent COMPARISON) */
export interface ComparisonEngineResult {
  winner: string;
  valuation_comparison: string;
  growth_comparison: string;
  quality_comparison: string;
  recommendation: Record<string, string>;
  summary: string;
}

/** POST `/api/ai/query` — intent routing envelope */
export type RoutedAiResponse =
  | { mode: 'SCREENER'; intent: IntentClassificationResult; result: StockScreenResult }
  | { mode: 'VALUATION_ANALYSIS'; intent: IntentClassificationResult; result: ValuationAnalysisResult }
  | { mode: 'STOCK_ANALYSIS'; intent: IntentClassificationResult; result: ResearchAssistantResult }
  | { mode: 'COMPARISON'; intent: IntentClassificationResult; result: ComparisonEngineResult }
  | { mode: 'UNKNOWN'; intent: IntentClassificationResult; result: null; message: string };

/** Relative valuation engine input (POST `/api/ai/valuation/relative`) */
export interface RelativeValuationInput {
  company_name: string;
  current_pe: number;
  historical_pe_range: { min: number; max: number };
  historical_median_pe: number;
  peer_pe_range?: { min: number; max: number };
  /** Trailing / expected revenue growth, percent */
  revenue_growth: number;
  /** Return on equity, percent */
  roe: number;
  sector: string;
}

export type RelativeVerdict = 'undervalued' | 'fairly_valued' | 'overvalued';

/** Structured output from `computeRelativeValuation` */
export interface RelativeValuationResult {
  verdict: RelativeVerdict;
  /** Composite: sum of score_breakdown; higher = more attractive on this rubric */
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

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
