import { apiClient } from './api';
import {
  AIResearchResponse,
  ScreenerResult,
  EarningsAnalysis,
  ApiResponse,
  IntentClassificationResult,
  RoutedAiResponse,
  RelativeValuationInput,
  RelativeValuationResult,
} from '@/types';

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

  async classifyIntent(query: string): Promise<IntentClassificationResult> {
    const response = await apiClient.post<ApiResponse<IntentClassificationResult>>('/ai/intent', {
      query,
    });
    if (!response.data.data) throw new Error('Intent classification failed');
    return response.data.data;
  },

  async routeAiQuery(question: string, ticker?: string): Promise<RoutedAiResponse> {
    const response = await apiClient.post<ApiResponse<RoutedAiResponse>>('/ai/query', {
      question,
      ticker,
    });
    if (!response.data.data) throw new Error('Routed query failed');
    return response.data.data;
  },

  async relativeValuation(payload: RelativeValuationInput): Promise<RelativeValuationResult> {
    const response = await apiClient.post<ApiResponse<RelativeValuationResult>>(
      '/ai/valuation/relative',
      payload
    );
    if (!response.data.data) throw new Error('Relative valuation failed');
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
