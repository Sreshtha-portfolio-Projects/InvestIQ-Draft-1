import { apiClient } from './api';
import { AIResearchResponse, ScreenerResult, EarningsAnalysis, ApiResponse } from '@/types';

export const aiService = {
  async askResearch(question: string, ticker?: string): Promise<AIResearchResponse> {
    const response = await apiClient.post<ApiResponse<AIResearchResponse>>('/ai/research', {
      question,
      ticker,
    });
    if (!response.data.data) throw new Error('AI analysis failed');
    return response.data.data;
  },

  async screenStocks(query: string): Promise<ScreenerResult> {
    const response = await apiClient.post<ApiResponse<ScreenerResult>>('/ai/screen', { query });
    if (!response.data.data) throw new Error('Screening failed');
    return response.data.data;
  },

  async analyzeEarnings(companyId: string, transcript: string): Promise<EarningsAnalysis> {
    const response = await apiClient.post<ApiResponse<EarningsAnalysis>>('/ai/earnings/analyze', {
      companyId,
      transcript,
    });
    if (!response.data.data) throw new Error('Earnings analysis failed');
    return response.data.data;
  },

  async getEarningsAnalysis(companyId: string): Promise<EarningsAnalysis | null> {
    try {
      const response = await apiClient.get<ApiResponse<EarningsAnalysis>>(`/ai/earnings/${companyId}`);
      return response.data.data || null;
    } catch {
      return null;
    }
  },
};
