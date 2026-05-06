import { getSupabaseClient } from './supabase';
import { logger } from '../utils/logger';

export interface FuzzyCompanyMatch {
  ticker: string;
  name: string;
  score: number;
}

/**
 * pg_trgm RPC (`fuzzy_search_companies`). Requires migration `companies_aliases_fuzzy.sql`.
 * Returns [] if RPC missing or errors — callers should fall back to ilike.
 */
export async function fuzzySearchCompanies(
  query: string,
  limit = 5
): Promise<FuzzyCompanyMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('fuzzy_search_companies', {
      search_query: q,
      result_limit: limit,
    });

    if (error) {
      logger.warn('fuzzy_search_companies RPC unavailable or failed', { message: error.message });
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: { ticker: string; name: string; score: number }) => ({
      ticker: String(row.ticker).toUpperCase(),
      name: row.name,
      score: typeof row.score === 'number' ? row.score : Number(row.score),
    }));
  } catch (err) {
    logger.warn('fuzzySearchCompanies threw', err);
    return [];
  }
}
