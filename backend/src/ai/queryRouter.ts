import { intentClassifierService } from './intentClassifier';
import { screenerInterpreterService } from './screenerInterpreter';
import { researchAssistantService } from './researchAssistant';
import { valuationAnalysisService } from './valuationAnalysis';
import { comparisonEngineService } from './comparisonEngine';
import type { RoutedAiResponse } from '../types';
import { logger } from '../utils/logger';

export interface RouteUserQueryInput {
  /** Primary user text (same as screener NL or assistant question) */
  query: string;
  /** Optional explicit ticker from UI context */
  ticker?: string;
}

export async function routeUserQuery(input: RouteUserQueryInput): Promise<RoutedAiResponse> {
  const query = input.query.trim();
  const intent = await intentClassifierService.classify(query);

  logger.info('routeUserQuery', { mode: intent.mode, confidence: intent.confidence });

  switch (intent.mode) {
    case 'SCREENER': {
      const result = await screenerInterpreterService.screen(query);
      return { mode: 'SCREENER', intent, result };
    }
    case 'VALUATION_ANALYSIS': {
      const result = await valuationAnalysisService.analyze({ question: query, ticker: input.ticker });
      return { mode: 'VALUATION_ANALYSIS', intent, result };
    }
    case 'STOCK_ANALYSIS': {
      const result = await researchAssistantService.analyze({ question: query, ticker: input.ticker });
      return { mode: 'STOCK_ANALYSIS', intent, result };
    }
    case 'COMPARISON': {
      const result = await comparisonEngineService.compare({ question: query, intent });
      return { mode: 'COMPARISON', intent, result };
    }
    default: {
      return {
        mode: 'UNKNOWN',
        intent,
        result: null,
        message:
          'Your message could not be routed to screener, single-stock analysis, valuation, or comparison. Rephrase with a clear investing task (e.g. screen criteria, one company name, or two stocks to compare).',
      };
    }
  }
}
