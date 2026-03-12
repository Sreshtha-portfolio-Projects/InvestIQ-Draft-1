import apiClient from './apiClient';
import { ScreenerFilters, ScreenerResult } from '@/types';

export const screenerService = {
  async screen(query?: string, filters?: ScreenerFilters): Promise<ScreenerResult> {
    const response = await apiClient.post<{ success: boolean; data: ScreenerResult }>(
      '/screener/screen',
      { query, filters }
    );
    return response.data;
  },

  async interpretQuery(query: string): Promise<ScreenerFilters> {
    const response = await apiClient.post<{ success: boolean; data: { filters: ScreenerFilters } }>(
      '/screener/interpret',
      { query }
    );
    return response.data.filters;
  },
};
