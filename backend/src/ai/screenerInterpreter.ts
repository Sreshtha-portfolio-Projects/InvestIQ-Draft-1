import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { getSupabaseClient } from '../db/supabase';
import { ScreenerFilters, Company } from '../types';
import { logger } from '../utils/logger';

interface ScreenerInterpretation {
  filters: ScreenerFilters;
  interpretation: string;
  suggested_query_refinements: string[];
}

interface ScreenerResult {
  companies: (Company & { financials?: Record<string, unknown> })[];
  applied_filters: ScreenerFilters;
  interpretation: string;
  suggestions: string[];
  total_count: number;
}

const AVAILABLE_SECTORS = [
  'Technology', 'Financial Services', 'Energy', 'Automobile',
  'Healthcare', 'Consumer', 'Telecom', 'Industrials', 'Real Estate', 'Materials',
];

export class ScreenerInterpreterService {
  async screen(userQuery: string): Promise<ScreenerResult> {
    // Step 1: Use AI to interpret the natural language query
    const prompt = PROMPTS.SCREENER_INTERPRETER(userQuery, AVAILABLE_SECTORS);
    const interpretation = await aiClient.generateJSON<ScreenerInterpretation>(prompt);

    logger.info('Screener interpretation', { query: userQuery, filters: interpretation.filters });

    // Step 2: Execute database query with interpreted filters
    const companies = await this.executeScreenerQuery(interpretation.filters);

    return {
      companies,
      applied_filters: interpretation.filters,
      interpretation: interpretation.interpretation,
      suggestions: interpretation.suggested_query_refinements || [],
      total_count: companies.length,
    };
  }

  private async executeScreenerQuery(
    filters: ScreenerFilters
  ): Promise<(Company & { financials?: Record<string, unknown> })[]> {
    try {
      const supabase = getSupabaseClient();

      // Build company query
      let companyQuery = supabase
        .from('companies')
        .select(`
          *,
          financials (
            pe_ratio,
            eps,
            revenue_growth,
            roe,
            debt_to_equity,
            year
          )
        `)
        .order('name');

      if (filters.sector) {
        companyQuery = companyQuery.eq('sector', filters.sector);
      }

      if (filters.market_cap_category) {
        const marketCapRanges = {
          large: [100000000000, null] as [number, null],
          mid: [10000000000, 100000000000] as [number, number],
          small: [null, 10000000000] as [null, number],
        };

        const range = marketCapRanges[filters.market_cap_category];
        if (range[0]) companyQuery = companyQuery.gte('market_cap', range[0]);
        if (range[1]) companyQuery = companyQuery.lte('market_cap', range[1]);
      }

      const { data: companies, error } = await companyQuery.limit(50);

      if (error) {
        logger.error('Screener DB query error', error);
        return [];
      }

      if (!companies) return [];

      // Apply financial filters in memory (since financials are in a related table)
      return companies.filter((company: Company & { financials?: Record<string, unknown>[] }) => {
        const fin = company.financials?.[0] as Record<string, number> | undefined;
        if (!fin) return true; // Include companies without financial data

        if (filters.max_pe && fin.pe_ratio && fin.pe_ratio > filters.max_pe) return false;
        if (filters.min_revenue_growth && fin.revenue_growth && fin.revenue_growth < filters.min_revenue_growth) return false;
        if (filters.max_debt_to_equity && fin.debt_to_equity && fin.debt_to_equity > filters.max_debt_to_equity) return false;
        if (filters.min_roe && fin.roe && fin.roe < filters.min_roe) return false;

        return true;
      });
    } catch (err) {
      logger.error('Screener query execution failed', err);
      return [];
    }
  }
}

export const screenerInterpreterService = new ScreenerInterpreterService();
