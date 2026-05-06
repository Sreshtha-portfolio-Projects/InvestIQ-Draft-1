/**
 * Company market data loading for AI prompts.
 * Ticker resolution lives in `./tickerResolver` (DB + Finnhub hybrid).
 */

import { marketDataService } from '../market/marketDataService';
import { getSupabaseClient } from '../db/supabase';
import { logger } from '../utils/logger';

export {
  KNOWN_INDIAN_TICKERS,
  resolveTickersFromText,
  resolveFirstTicker,
  extractTickersFromText,
  extractFirstTicker,
  extractCandidatePhrases,
  normalizeExchangeSymbol,
} from './tickerResolver';

export type { FinnhubSymbolRow } from './tickerResolver';

export interface CompanyResearchBundle {
  ticker: string;
  companyName: string;
  sector: string;
  financials: Record<string, unknown>;
  companyData: Record<string, unknown>;
  marketData: Record<string, unknown>;
}

export async function fetchCompanyResearchBundle(tickerRaw: string): Promise<CompanyResearchBundle | null> {
  const ticker = tickerRaw.toUpperCase();
  let companyData: Record<string, unknown> = {};
  let financials: Record<string, unknown> = {};
  let marketData: Record<string, unknown> = {};
  let companyName = ticker;
  let sector = 'Unknown';

  try {
    const supabase = getSupabaseClient();
    const { data: company } = await supabase
      .from('companies')
      .select('*, financials(*)')
      .eq('ticker', ticker)
      .single();

    if (company) {
      companyName = company.name as string;
      sector = (company.sector as string) || 'Unknown';
      financials = (company.financials?.[0] as Record<string, unknown>) || {};
    }

    const [overview, quote] = await Promise.allSettled([
      marketDataService.getCompanyOverview(ticker),
      marketDataService.getStockQuote(ticker),
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

    return {
      ticker,
      companyName,
      sector,
      financials,
      companyData,
      marketData,
    };
  } catch (err) {
    logger.error('fetchCompanyResearchBundle failed', { ticker, err });
    return null;
  }
}
