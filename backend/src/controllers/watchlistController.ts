import { Request, Response, NextFunction } from 'express';
import { WatchlistRepository, CompanyRepository } from '../db/repositories';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../middleware/auth';

const watchlistRepo = new WatchlistRepository();
const companyRepo = new CompanyRepository();

export class WatchlistController {
  getWatchlist = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    const watchlist = await watchlistRepo.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: watchlist,
    });
  });

  addToWatchlist = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { ticker } = req.body;

    if (!ticker) {
      throw ApiError.badRequest('Ticker is required');
    }

    const company = await companyRepo.findByTicker(ticker.toUpperCase());

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const entry = await watchlistRepo.create(userId, company.id);

    res.status(201).json({
      success: true,
      data: entry,
    });
  });

  removeFromWatchlist = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const { ticker } = req.params;

      const company = await companyRepo.findByTicker(ticker.toUpperCase());

      if (!company) {
        throw ApiError.notFound('Company not found');
      }

      await watchlistRepo.delete(userId, company.id);

      res.status(200).json({
        success: true,
        message: 'Removed from watchlist',
      });
    }
  );

  checkWatchlist = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { ticker } = req.params;

    const company = await companyRepo.findByTicker(ticker.toUpperCase());

    if (!company) {
      res.status(200).json({
        success: true,
        data: { in_watchlist: false },
      });
      return;
    }

    const inWatchlist = await watchlistRepo.exists(userId, company.id);

    res.status(200).json({
      success: true,
      data: { in_watchlist: inWatchlist },
    });
  });
}

export default new WatchlistController();
