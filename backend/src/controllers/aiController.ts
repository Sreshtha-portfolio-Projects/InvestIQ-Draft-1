import { Request, Response } from 'express';
import { researchAssistantService } from '../ai/researchAssistant';
import { screenerInterpreterService } from '../ai/screenerInterpreter';
import { earningsAnalyzerService } from '../ai/earningsAnalyzer';
import { routeUserQuery } from '../ai/queryRouter';
import { intentClassifierService } from '../ai/intentClassifier';
import { computeRelativeValuation } from '../analysis/relativeValuationEngine';
import type { RelativeValuationInput } from '../types';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const aiUpstreamStatus = (message: string): number => {
  const m = message.toLowerCase();
  if (
    m.includes('ai service') ||
    m.includes('openrouter') ||
    m.includes('malformed') ||
    m.includes('quota') ||
    m.includes('rate limit')
  ) {
    return 503;
  }
  return 500;
};

export const routeAiQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { question, ticker } = req.body;

    if (!question || String(question).trim().length < 3) {
      sendError(res, 'Please provide a valid query', 400);
      return;
    }

    logger.info('Routed AI query', {
      question: String(question).slice(0, 200),
      ticker,
      userId: req.userId,
    });

    const result = await routeUserQuery({
      query: String(question).trim(),
      ticker: ticker ? String(ticker) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Routed query failed';
    logger.error('Routed AI query error', err);
    sendError(res, message, aiUpstreamStatus(message));
  }
};

export const askResearchAssistant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { question, ticker } = req.body;

    if (!question || question.trim().length < 3) {
      sendError(res, 'Please provide a valid question', 400);
      return;
    }

    logger.info('Research assistant query', { question, ticker, userId: req.userId });

    const result = await researchAssistantService.analyze({ question: question.trim(), ticker });
    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI analysis failed';
    logger.error('Research assistant error', err);
    sendError(res, message, aiUpstreamStatus(message));
  }
};

export const classifyIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || String(query).trim().length < 3) {
      sendError(res, 'Please provide a query to classify', 400);
      return;
    }

    logger.info('Intent classification', { query: String(query).slice(0, 200) });

    const result = await intentClassifierService.classify(String(query).trim());
    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Intent classification failed';
    logger.error('Intent classification error', err);
    sendError(res, message, aiUpstreamStatus(message));
  }
};

export const screenStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 3) {
      sendError(res, 'Please provide a screening query', 400);
      return;
    }

    logger.info('Screener query', { query });

    const result = await screenerInterpreterService.screen(query.trim());
    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Screener failed';
    logger.error('Screener error', err);
    sendError(res, message, aiUpstreamStatus(message));
  }
};

export const analyzeEarnings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { companyId, transcriptId, transcript } = req.body;

    if (!companyId) {
      sendError(res, 'companyId is required', 400);
      return;
    }

    if (!transcriptId && !transcript) {
      sendError(res, 'Either transcriptId or transcript text is required', 400);
      return;
    }

    logger.info('Earnings analysis request', { companyId, transcriptId });

    const result = await earningsAnalyzerService.analyzeTranscript(
      companyId,
      transcriptId,
      transcript
    );

    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Earnings analysis failed';
    logger.error('Earnings analyzer error', err);
    sendError(res, message, aiUpstreamStatus(message));
  }
};

export const getEarningsAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.params['companyId'] as string;
    const result = await earningsAnalyzerService.getLatestAnalysis(companyId);

    if (!result) {
      sendError(res, 'No earnings analysis found for this company', 404);
      return;
    }

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 'Failed to fetch earnings analysis', 500);
  }
};

export const relativeValuation = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as RelativeValuationInput;

    if (
      !body?.company_name ||
      body.current_pe == null ||
      body.historical_median_pe == null ||
      body.revenue_growth == null ||
      body.roe == null ||
      !body?.sector ||
      body.historical_pe_range?.min == null ||
      body.historical_pe_range?.max == null
    ) {
      sendError(
        res,
        'Required: company_name, current_pe, historical_median_pe, historical_pe_range { min, max }, revenue_growth, roe, sector',
        400
      );
      return;
    }

    const result = computeRelativeValuation(body);
    sendSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Relative valuation failed';
    logger.error('Relative valuation error', err);
    sendError(res, message, 500);
  }
};

