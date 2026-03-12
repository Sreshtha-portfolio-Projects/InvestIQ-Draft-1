import { Request, Response } from 'express';
import { stockService } from '../services/stockService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const searchStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 1) {
      sendError(res, 'Search query is required', 400);
      return;
    }

    const results = await stockService.searchStocks(query.trim());
    sendSuccess(res, results);
  } catch (err) {
    sendError(res, 'Stock search failed', 500);
  }
};

export const getStockDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawTicker = req.params['ticker'];
    const ticker = Array.isArray(rawTicker) ? rawTicker[0] : rawTicker;

    if (!ticker) {
      sendError(res, 'Ticker symbol is required', 400);
      return;
    }

    const data = await stockService.getCompanyWithFinancials(ticker.toUpperCase());

    if (!data) {
      sendError(res, `Stock ${ticker} not found`, 404);
      return;
    }

    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to fetch stock details', 500);
  }
};

export const getMarketDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await stockService.getMarketDashboard();
    const trending = await stockService.getTrendingStocks();
    sendSuccess(res, { ...dashboard, trending });
  } catch (err) {
    sendError(res, 'Failed to fetch market dashboard', 500);
  }
};
