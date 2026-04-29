import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { marketDataService } from '../market/marketDataService';
import { getSupabaseClient } from '../db/supabase';
import { AIResearchResponse } from '../types';
import { logger } from '../utils/logger';

interface ResearchRequest {
  question: string;
  ticker?: string;
}

interface ResearchResult {
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

export class ResearchAssistantService {
  async analyze(request: ResearchRequest): Promise<ResearchResult> {
    const { question, ticker } = request;

    // Extract ticker from question if not explicitly provided
    const resolvedTicker = ticker || this.extractTickerFromQuestion(question);

    let companyData: Record<string, unknown> = {};
    let financials: Record<string, unknown> = {};
    let marketData: Record<string, unknown> = {};
    let companyName = resolvedTicker || 'Unknown Company';
    let sector = 'Unknown';

    if (resolvedTicker) {
      try {
        // Fetch from database first
        const supabase = getSupabaseClient();
        const { data: company } = await supabase
          .from('companies')
          .select('*, financials(*)')
          .eq('ticker', resolvedTicker.toUpperCase())
          .single();

        if (company) {
          companyName = company.name;
          sector = company.sector || 'Unknown';
          financials = company.financials?.[0] || {};
        }

        // Fetch live market data
        const [overview, quote] = await Promise.allSettled([
          marketDataService.getCompanyOverview(resolvedTicker),
          marketDataService.getStockQuote(resolvedTicker),
        ]);

        if (overview.status === 'fulfilled' && overview.value) {
          companyData = overview.value;
          companyName = (companyData['Name'] as string) || companyName;
          sector = (companyData['Sector'] as string) || sector;
          financials = {
            ...financials,
            pe_ratio: companyData['PERatio'],
            eps: companyData['EPS'],
            dividend_yield: companyData['DividendYield'],
            beta: companyData['Beta'],
            market_cap: companyData['MarketCapitalization'],
          };
        }

        if (quote.status === 'fulfilled' && quote.value) {
          marketData = quote.value as unknown as Record<string, unknown>;
        }
      } catch (err) {
        logger.error('Failed to fetch company data for research', { ticker: resolvedTicker, err });
      }
    }

    const prompt = PROMPTS.RESEARCH_ASSISTANT(
      resolvedTicker || 'Unknown',
      companyName,
      sector,
      financials,
      question,
      marketData
    );

    const result = await aiClient.generateJSON<ResearchResult>(prompt);

    // Cache the analysis
    if (resolvedTicker) {
      try {
        const supabase = getSupabaseClient();
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('ticker', resolvedTicker.toUpperCase())
          .single();

        if (company) {
          await supabase.from('ai_analyses').insert({
            company_id: company.id,
            analysis_type: 'research',
            query: question,
            result,
          });
        }
      } catch {
        // Non-critical: caching failure should not break the response
      }
    }

    return {
      ...result,
      ticker: resolvedTicker,
      company_name: companyName,
    };
  }

  private extractTickerFromQuestion(question: string): string | undefined {
    // Known Indian stock tickers to detect in question
    const knownTickers = [
      'TCS', 'INFY', 'HDFCBANK', 'RELIANCE', 'ICICIBANK', 'WIPRO',
      'HCLTECH', 'TATAMOTORS', 'BHARTIARTL', 'SBIN', 'MARUTI',
      'ASIANPAINT', 'HINDUNILVR', 'BAJFINANCE', 'SUNPHARMA',
    ];

    const upperQuestion = question.toUpperCase();
    return knownTickers.find((t) => upperQuestion.includes(t));
  }
}

export const researchAssistantService = new ResearchAssistantService();
