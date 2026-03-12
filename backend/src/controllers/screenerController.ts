import { Request, Response, NextFunction } from 'express';
import screenerInterpreter from '../ai/screenerInterpreter';
import { FinancialRepository } from '../db/repositories';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';

const financialRepo = new FinancialRepository();

export class ScreenerController {
  screen = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { query, filters } = req.body;

    let screenFilters = filters;

    if (query && !filters) {
      screenFilters = await screenerInterpreter.interpretQuery(query);
    }

    if (!screenFilters || Object.keys(screenFilters).length === 0) {
      throw ApiError.badRequest('Either query or filters are required');
    }

    const results = await financialRepo.screenCompanies(screenFilters);

    const description = query
      ? query
      : await screenerInterpreter.generateScreenDescription(screenFilters);

    res.status(200).json({
      success: true,
      data: {
        description,
        filters: screenFilters,
        results: results.slice(0, 50),
        total: results.length,
      },
    });
  });

  interpretQuery = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req.body;

    if (!query) {
      throw ApiError.badRequest('Query is required');
    }

    const filters = await screenerInterpreter.interpretQuery(query);

    res.status(200).json({
      success: true,
      data: {
        filters,
      },
    });
  });
}

export default new ScreenerController();
