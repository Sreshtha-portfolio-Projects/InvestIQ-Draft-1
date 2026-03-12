import { Response } from 'express';
import { watchlistService } from '../services/watchlistService';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';

export const getWatchlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const items = await watchlistService.getWatchlist(userId);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, 'Failed to fetch watchlist', 500);
  }
};

export const addToWatchlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { companyId } = req.body;

    if (!companyId) {
      sendError(res, 'companyId is required', 400);
      return;
    }

    const item = await watchlistService.addToWatchlist(userId, companyId);
    sendCreated(res, item, 'Stock added to watchlist');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add to watchlist';
    sendError(res, message, 400);
  }
};

export const removeFromWatchlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const companyId = req.params['companyId'] as string;

    if (!companyId) {
      sendError(res, 'companyId is required', 400);
      return;
    }

    await watchlistService.removeFromWatchlist(userId, companyId);
    sendSuccess(res, null, 'Stock removed from watchlist');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove from watchlist';
    sendError(res, message, 400);
  }
};
