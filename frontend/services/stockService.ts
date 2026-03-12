import { apiClient } from './api';
import { Company, StockDetail, MarketDashboard, ApiResponse } from '@/types';

export const stockService = {
  async search(query: string): Promise<Company[]> {
    const response = await apiClient.get<ApiResponse<Company[]>>(`/stocks/search?q=${encodeURIComponent(query)}`);
    return response.data.data || [];
  },

  async getStockDetail(ticker: string): Promise<StockDetail> {
    const response = await apiClient.get<ApiResponse<StockDetail>>(`/stocks/${ticker}`);
    if (!response.data.data) throw new Error('Stock not found');
    return response.data.data;
  },

  async getMarketDashboard(): Promise<MarketDashboard> {
    const response = await apiClient.get<ApiResponse<MarketDashboard>>('/stocks/market');
    if (!response.data.data) throw new Error('Failed to fetch market data');
    return response.data.data;
  },
};
