import apiClient from './apiClient';
import { AIAnalysis, StockComparison } from '@/types';

export const aiService = {
  async analyzeStock(ticker: string, query?: string): Promise<AIAnalysis> {
    const response = await apiClient.post<{ success: boolean; data: AIAnalysis }>(
      '/ai/analyze',
      { ticker, query }
    );
    return response.data;
  },

  async compareStocks(ticker1: string, ticker2: string): Promise<StockComparison> {
    const response = await apiClient.post<{ success: boolean; data: StockComparison }>(
      '/ai/compare',
      { ticker1, ticker2 }
    );
    return response.data;
  },

  async chat(query: string, context?: any): Promise<string> {
    const response = await apiClient.post<{ success: boolean; data: { response: string } }>(
      '/ai/chat',
      { query, context }
    );
    return response.data.response;
  },
};
