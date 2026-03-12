'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { watchlistService } from '@/services/watchlistService';
import { aiService } from '@/services/aiService';

export const useMarketDashboard = () => {
  return useQuery({
    queryKey: ['market-dashboard'],
    queryFn: () => stockService.getMarketDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes for market data
  });
};

export const useStockDetail = (ticker: string) => {
  return useQuery({
    queryKey: ['stock', ticker],
    queryFn: () => stockService.getStockDetail(ticker),
    enabled: !!ticker,
  });
};

export const useStockSearch = (query: string) => {
  return useQuery({
    queryKey: ['stock-search', query],
    queryFn: () => stockService.search(query),
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  });
};

export const useWatchlist = () => {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistService.getWatchlist(),
  });
};

export const useAddToWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => watchlistService.addToWatchlist(companyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });
};

export const useRemoveFromWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => watchlistService.removeFromWatchlist(companyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });
};

export const useResearchAssistant = () => {
  return useMutation({
    mutationFn: ({ question, ticker }: { question: string; ticker?: string }) =>
      aiService.askResearch(question, ticker),
  });
};

export const useStockScreener = () => {
  return useMutation({
    mutationFn: (query: string) => aiService.screenStocks(query),
  });
};

export const useEarningsAnalysis = (companyId: string) => {
  return useQuery({
    queryKey: ['earnings-analysis', companyId],
    queryFn: () => aiService.getEarningsAnalysis(companyId),
    enabled: !!companyId,
  });
};

export const useAnalyzeEarnings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, transcript }: { companyId: string; transcript: string }) =>
      aiService.analyzeEarnings(companyId, transcript),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['earnings-analysis', companyId] });
    },
  });
};
