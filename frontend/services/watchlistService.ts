import apiClient from './apiClient';
import { WatchlistItem } from '@/types';

export const watchlistService = {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await apiClient.get<{ success: boolean; data: WatchlistItem[] }>(
      '/watchlist'
    );
    return response.data;
  },

  async addToWatchlist(ticker: string): Promise<WatchlistItem> {
    const response = await apiClient.post<{ success: boolean; data: WatchlistItem }>(
      '/watchlist',
      { ticker }
    );
    return response.data;
  },

  async removeFromWatchlist(ticker: string): Promise<void> {
    await apiClient.delete(`/watchlist/${ticker}`);
  },

  async checkWatchlist(ticker: string): Promise<boolean> {
    const response = await apiClient.get<{
      success: boolean;
      data: { in_watchlist: boolean };
    }>(`/watchlist/${ticker}/check`);
    return response.data.in_watchlist;
  },
};
