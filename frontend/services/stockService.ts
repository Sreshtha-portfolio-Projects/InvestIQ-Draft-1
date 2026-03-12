import apiClient from './apiClient';
import { StockQuote, StockOverview, ChartDataPoint } from '@/types';

export const stockService = {
  async search(query: string) {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/stocks/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async getQuote(ticker: string): Promise<StockQuote> {
    const response = await apiClient.get<{ success: boolean; data: StockQuote }>(
      `/stocks/${ticker}/quote`
    );
    return response.data;
  },

  async getOverview(ticker: string): Promise<StockOverview> {
    const response = await apiClient.get<{ success: boolean; data: StockOverview }>(
      `/stocks/${ticker}/overview`
    );
    return response.data;
  },

  async getChartData(ticker: string, interval: string = 'daily'): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<{ success: boolean; data: ChartDataPoint[] }>(
      `/stocks/${ticker}/chart?interval=${interval}`
    );
    return response.data;
  },
};
