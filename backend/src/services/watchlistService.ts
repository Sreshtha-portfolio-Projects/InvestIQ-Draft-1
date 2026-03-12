import { getSupabaseClient } from '../db/supabase';
import { marketDataService } from '../market/marketDataService';
import { logger } from '../utils/logger';

export class WatchlistService {
  async getWatchlist(userId: string) {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('watchlists')
        .select('*, companies(*)')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch watchlist', error);
        return [];
      }

      // Enrich with live quotes
      const enrichedItems = await Promise.allSettled(
        (data || []).map(async (item: { companies: { ticker: string } | null } & Record<string, unknown>) => {
          const company = item.companies as { ticker: string } | null;
          if (!company?.ticker) return item;

          const quote = await marketDataService.getStockQuote(company.ticker);
          return { ...item, quote };
        })
      );

      return enrichedItems
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<unknown>).value);
    } catch (err) {
      logger.error('Watchlist fetch error', err);
      return [];
    }
  }

  async addToWatchlist(userId: string, companyId: string) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('watchlists')
      .insert({ user_id: userId, company_id: companyId })
      .select('*, companies(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Stock already in watchlist');
      }
      logger.error('Failed to add to watchlist', error);
      throw new Error('Failed to add stock to watchlist');
    }

    return data;
  }

  async removeFromWatchlist(userId: string, companyId: string) {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) {
      logger.error('Failed to remove from watchlist', error);
      throw new Error('Failed to remove stock from watchlist');
    }
  }

  async isInWatchlist(userId: string, companyId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    return !!data;
  }

  async getWatchlistByTicker(userId: string, ticker: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from('watchlists')
      .select('id, companies!inner(ticker)')
      .eq('user_id', userId)
      .eq('companies.ticker', ticker.toUpperCase())
      .single();

    return !!data;
  }
}

export const watchlistService = new WatchlistService();
