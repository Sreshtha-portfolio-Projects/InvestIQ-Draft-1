import { marketDataService } from '../market/marketDataService';
import { getSupabaseClient } from '../db/supabase';
import { logger } from '../utils/logger';

/** Common NSE/BSE-style symbols used for substring matching in user queries */
export const KNOWN_INDIAN_TICKERS = [
  'TCS',
  'INFY',
  'HDFCBANK',
  'RELIANCE',
  'ICICIBANK',
  'WIPRO',
  'HCLTECH',
  'TATAMOTORS',
  'BHARTIARTL',
  'SBIN',
  'MARUTI',
  'ASIANPAINT',
  'HINDUNILVR',
  'BAJFINANCE',
  'SUNPHARMA',
  'LT',
  'AXISBANK',
  'KOTAKBANK',
  'ULTRACEMCO',
  'NESTLEIND',
  'POWERGRID',
  'ITC',
  'ONGC',
  'TITAN',
] as const;

/** Resolve common company names in prose to tickers when the symbol is not spelled out */
const PHRASE_TICKER_HINTS: [RegExp, string][] = [
  [/infosys/i, 'INFY'],
  [/hdfc\s*bank/i, 'HDFCBANK'],
  [/icici\s*bank/i, 'ICICIBANK'],
  [/bharti\s*airtel/i, 'BHARTIARTL'],
  [/hcl\s*tech/i, 'HCLTECH'],
  [/asian\s*paints?/i, 'ASIANPAINT'],
  [/hindustan\s*unilever/i, 'HINDUNILVR'],
  [/bajaj\s*finance/i, 'BAJFINANCE'],
  [/sun\s*pharma/i, 'SUNPHARMA'],
];

export function extractTickersFromText(text: string, limit = 2): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const [re, sym] of PHRASE_TICKER_HINTS) {
    if (re.test(text) && !seen.has(sym)) {
      seen.add(sym);
      out.push(sym);
      if (out.length >= limit) return out;
    }
  }

  const upper = text.toUpperCase();

  for (const t of KNOWN_INDIAN_TICKERS) {
    if (upper.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
      if (out.length >= limit) break;
    }
  }

  return out;
}

export function extractFirstTicker(text: string): string | undefined {
  return extractTickersFromText(text, 1)[0];
}

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
