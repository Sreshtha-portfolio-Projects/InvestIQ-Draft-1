import { apiClient } from './api';
import { WatchlistItem, ApiResponse } from '@/types';

export const watchlistService = {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await apiClient.get<ApiResponse<WatchlistItem[]>>('/watchlist');
    return response.data.data || [];
  },

  async addToWatchlist(companyId: string): Promise<WatchlistItem> {
    const response = await apiClient.post<ApiResponse<WatchlistItem>>('/watchlist', { companyId });
    if (!response.data.data) throw new Error('Failed to add to watchlist');
    return response.data.data;
  },

  async removeFromWatchlist(companyId: string): Promise<void> {
    await apiClient.delete(`/watchlist/${companyId}`);
  },
};
