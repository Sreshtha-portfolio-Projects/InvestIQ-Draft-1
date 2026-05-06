import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { getSupabaseClient } from '../db/supabase';
import { extractFirstTicker, fetchCompanyResearchBundle } from './companyContext';
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

    const resolvedTicker = ticker || extractFirstTicker(question);

    let financials: Record<string, unknown> = {};
    let marketData: Record<string, unknown> = {};
    let companyName = resolvedTicker || 'Unknown Company';
    let sector = 'Unknown';

    if (resolvedTicker) {
      try {
        const bundle = await fetchCompanyResearchBundle(resolvedTicker);
        if (bundle) {
          companyName = bundle.companyName;
          sector = bundle.sector;
          financials = bundle.financials;
          marketData = bundle.marketData;
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
}

export const researchAssistantService = new ResearchAssistantService();
