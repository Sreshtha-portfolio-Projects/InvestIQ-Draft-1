import { Request, Response, NextFunction } from 'express';
import { CompanyRepository, FinancialRepository } from '../db/repositories';
import researchAssistant from '../ai/researchAssistant';
import marketDataService from '../services/marketDataService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../middleware/auth';

const companyRepo = new CompanyRepository();
const financialRepo = new FinancialRepository();

export class AIController {
  analyzeStock = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker, query } = req.body;

    if (!ticker) {
      throw ApiError.badRequest('Ticker is required');
    }

    const company = await companyRepo.findByTicker(ticker.toUpperCase());
    
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const [financials, overview] = await Promise.all([
      financialRepo.findLatestByCompanyId(company.id),
      marketDataService.getCompanyOverview(ticker.toUpperCase()),
    ]);

    const companyData = {
      ...company,
      ...overview,
    };

    const analysis = await researchAssistant.analyzeStock(
      ticker.toUpperCase(),
      companyData,
      financials,
      query
    );

    res.status(200).json({
      success: true,
      data: analysis,
    });
  });

  compareStocks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker1, ticker2 } = req.body;

    if (!ticker1 || !ticker2) {
      throw ApiError.badRequest('Both tickers are required');
    }

    const [company1, company2] = await Promise.all([
      companyRepo.findByTicker(ticker1.toUpperCase()),
      companyRepo.findByTicker(ticker2.toUpperCase()),
    ]);

    if (!company1 || !company2) {
      throw ApiError.notFound('One or both companies not found');
    }

    const [financials1, financials2] = await Promise.all([
      financialRepo.findLatestByCompanyId(company1.id),
      financialRepo.findLatestByCompanyId(company2.id),
    ]);

    const comparison = await researchAssistant.compareStocks(
      ticker1.toUpperCase(),
      ticker2.toUpperCase(),
      financials1,
      financials2
    );

    res.status(200).json({
      success: true,
      data: comparison,
    });
  });

  chat = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { query, context } = req.body;

    if (!query) {
      throw ApiError.badRequest('Query is required');
    }

    const response = await researchAssistant.answerQuery(query, context || {});

    res.status(200).json({
      success: true,
      data: {
        response,
      },
    });
  });
}

export default new AIController();
