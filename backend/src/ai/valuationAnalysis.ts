import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { fetchCompanyResearchBundle, extractFirstTicker } from './companyContext';
import { getSupabaseClient } from '../db/supabase';
import type { ValuationAnalysisResult } from '../types';
import { logger } from '../utils/logger';

export class ValuationAnalysisService {
  async analyze(request: { question: string; ticker?: string }): Promise<ValuationAnalysisResult> {
    const { question, ticker } = request;
    const resolvedTicker = ticker || (await extractFirstTicker(question));

    let companyName = resolvedTicker || 'Unknown Company';
    let sector = 'Unknown';
    let financials: Record<string, unknown> = {};
    let marketData: Record<string, unknown> = {};

    if (resolvedTicker) {
      const bundle = await fetchCompanyResearchBundle(resolvedTicker);
      if (bundle) {
        companyName = bundle.companyName;
        sector = bundle.sector;
        financials = bundle.financials;
        marketData = bundle.marketData;
      }
    }

    const prompt = PROMPTS.VALUATION_ANALYSIS(
      resolvedTicker || 'Unknown',
      companyName,
      sector,
      financials,
      question,
      marketData
    );

    const result = await aiClient.generateJSON<ValuationAnalysisResult>(prompt);

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
            analysis_type: 'valuation',
            query: question,
            result,
          });
        }
      } catch (err) {
        logger.error('Valuation analysis cache insert failed', { err });
      }
    }

    return {
      ...result,
      ticker: resolvedTicker,
      company_name: companyName,
    };
  }
}

export const valuationAnalysisService = new ValuationAnalysisService();
