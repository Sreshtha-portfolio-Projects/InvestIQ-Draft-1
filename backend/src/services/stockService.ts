import { getSupabaseClient } from '../db/supabase';
import { marketDataService } from '../market/marketDataService';
import { Company, StockQuote } from '../types';
import { logger } from '../utils/logger';

export class StockService {
  async searchStocks(query: string): Promise<Company[]> {
    return marketDataService.searchStocks(query);
  }

  async getCompanyByTicker(ticker: string): Promise<Company | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('ticker', ticker.toUpperCase())
        .single();

      if (error || !data) return null;
      return data;
    } catch (err) {
      logger.error('Failed to get company by ticker', { ticker, err });
      return null;
    }
  }

  async getCompanyWithFinancials(ticker: string) {
    try {
      const supabase = getSupabaseClient();

      const [dbResult, overview, quote, history] = await Promise.allSettled([
        supabase
          .from('companies')
          .select('*, financials(*)')
          .eq('ticker', ticker.toUpperCase())
          .single(),
        marketDataService.getCompanyOverview(ticker),
        marketDataService.getStockQuote(ticker),
        marketDataService.getPriceHistory(ticker),
      ]);

      const company = dbResult.status === 'fulfilled' ? dbResult.value.data : null;
      const overviewData = overview.status === 'fulfilled' ? overview.value : null;
      const quoteData = quote.status === 'fulfilled' ? quote.value : null;
      const historyData = history.status === 'fulfilled' ? history.value : [];

      if (!company && !overviewData) {
        return null;
      }

      return {
        company: company || { ticker: ticker.toUpperCase(), name: ticker },
        overview: overviewData,
        quote: quoteData,
        price_history: historyData,
        financials: company?.financials?.[0] || null,
      };
    } catch (err) {
      logger.error('Failed to get company with financials', { ticker, err });
      return null;
    }
  }

  async getMarketDashboard() {
    const [indices, movers] = await Promise.all([
      marketDataService.getMarketIndices(),
      marketDataService.getTopMovers(),
    ]);

    return {
      indices,
      top_gainers: movers.gainers,
      top_losers: movers.losers,
    };
  }

  async getTrendingStocks(): Promise<StockQuote[]> {
    // In production, derive from actual volume/momentum data
    const trendingTickers = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'TATAMOTORS'];
    const results = await Promise.allSettled(
      trendingTickers.map((t) => marketDataService.getStockQuote(t))
    );

    return results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<StockQuote>).value);
  }
}

export const stockService = new StockService();
