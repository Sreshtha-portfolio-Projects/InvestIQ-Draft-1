import apiClient from './apiClient';
import { MarketIndex, MarketMover } from '@/types';

export const marketService = {
  async getDashboard() {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        indices: MarketIndex[];
        top_gainers: MarketMover[];
        top_losers: MarketMover[];
        most_active: MarketMover[];
      };
    }>('/market/dashboard');
    return response.data;
  },

  async getIndices(): Promise<MarketIndex[]> {
    const response = await apiClient.get<{ success: boolean; data: MarketIndex[] }>(
      '/market/indices'
    );
    return response.data;
  },

  async getTopGainers(): Promise<MarketMover[]> {
    const response = await apiClient.get<{ success: boolean; data: MarketMover[] }>(
      '/market/gainers'
    );
    return response.data;
  },

  async getTopLosers(): Promise<MarketMover[]> {
    const response = await apiClient.get<{ success: boolean; data: MarketMover[] }>(
      '/market/losers'
    );
    return response.data;
  },

  async getTrending(): Promise<MarketMover[]> {
    const response = await apiClient.get<{ success: boolean; data: MarketMover[] }>(
      '/market/trending'
    );
    return response.data;
  },
};
