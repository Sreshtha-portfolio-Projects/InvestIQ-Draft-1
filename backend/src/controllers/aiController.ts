import { Request, Response } from 'express';
import { researchAssistantService } from '../ai/researchAssistant';
import { screenerInterpreterService } from '../ai/screenerInterpreter';
import { earningsAnalyzerService } from '../ai/earningsAnalyzer';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

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
    sendError(res, message, 500);
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
    sendError(res, message, 500);
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
    sendError(res, message, 500);
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
