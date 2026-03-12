import apiClient from './apiClient';
import { EarningsTranscript, EarningsAnalysis } from '@/types';

export const earningsService = {
  async getTranscripts(ticker: string): Promise<EarningsTranscript[]> {
    const response = await apiClient.get<{ success: boolean; data: EarningsTranscript[] }>(
      `/earnings/${ticker}`
    );
    return response.data;
  },

  async uploadTranscript(
    ticker: string,
    quarter: string,
    year: number,
    transcriptText: string
  ): Promise<EarningsTranscript> {
    const response = await apiClient.post<{ success: boolean; data: EarningsTranscript }>(
      '/earnings',
      { ticker, quarter, year, transcript_text: transcriptText }
    );
    return response.data;
  },

  async analyzeTranscript(id: string): Promise<EarningsAnalysis> {
    const response = await apiClient.get<{ success: boolean; data: EarningsAnalysis }>(
      `/earnings/${id}/analyze`
    );
    return response.data;
  },

  async summarizeTranscript(id: string): Promise<string> {
    const response = await apiClient.get<{ success: boolean; data: { summary: string } }>(
      `/earnings/${id}/summary`
    );
    return response.data.summary;
  },
};
