import { Request, Response, NextFunction } from 'express';
import marketDataService from '../services/marketDataService';
import { CompanyRepository, FinancialRepository } from '../db/repositories';
import { asyncHandler } from '../utils/asyncHandler';

const companyRepo = new CompanyRepository();
const financialRepo = new FinancialRepository();

export class MarketController {
  getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const [indices, movers] = await Promise.all([
      marketDataService.getMarketIndices(),
      marketDataService.getTopGainersLosers(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        indices,
        top_gainers: movers.top_gainers,
        top_losers: movers.top_losers,
        most_active: movers.most_actively_traded,
      },
    });
  });

  getIndices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const indices = await marketDataService.getMarketIndices();

    res.status(200).json({
      success: true,
      data: indices,
    });
  });

  getTopGainers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const movers = await marketDataService.getTopGainersLosers();

    res.status(200).json({
      success: true,
      data: movers.top_gainers,
    });
  });

  getTopLosers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const movers = await marketDataService.getTopGainersLosers();

    res.status(200).json({
      success: true,
      data: movers.top_losers,
    });
  });

  getTrending = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const movers = await marketDataService.getTopGainersLosers();

    res.status(200).json({
      success: true,
      data: movers.most_actively_traded,
    });
  });
}

export default new MarketController();
