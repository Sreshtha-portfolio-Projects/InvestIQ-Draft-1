import { Request, Response, NextFunction } from 'express';
import { CompanyRepository, FinancialRepository } from '../db/repositories';
import marketDataService from '../services/marketDataService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';

const companyRepo = new CompanyRepository();
const financialRepo = new FinancialRepository();

export class StockController {
  search = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw ApiError.badRequest('Search query is required');
    }

    const dbResults = await companyRepo.search(q);
    
    const apiResults = await marketDataService.searchSymbol(q);

    const combined = [
      ...dbResults.map((c) => ({
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        source: 'database',
      })),
      ...apiResults.slice(0, 5).map((r) => ({
        ticker: r.symbol,
        name: r.name,
        sector: r.type,
        source: 'api',
      })),
    ];

    const unique = Array.from(
      new Map(combined.map((item) => [item.ticker, item])).values()
    );

    res.status(200).json({
      success: true,
      data: unique.slice(0, 10),
    });
  });

  getQuote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker } = req.params;

    const quote = await marketDataService.getQuote(ticker.toUpperCase());

    res.status(200).json({
      success: true,
      data: quote,
    });
  });

  getOverview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker } = req.params;

    let company = await companyRepo.findByTicker(ticker.toUpperCase());
    
    const [overview, quote] = await Promise.all([
      marketDataService.getCompanyOverview(ticker.toUpperCase()),
      marketDataService.getQuote(ticker.toUpperCase()),
    ]);

    if (!company) {
      company = await companyRepo.create({
        ticker: overview.symbol,
        name: overview.name,
        sector: overview.sector,
        market_cap: overview.market_cap,
        description: overview.description,
      });
    }

    let financials = await financialRepo.findLatestByCompanyId(company.id);

    if (!financials) {
      financials = await financialRepo.create({
        company_id: company.id,
        year: new Date().getFullYear(),
        pe_ratio: overview.pe_ratio,
        eps: overview.eps,
        roe: overview.roe,
        debt_to_equity: overview.debt_to_equity,
        profit_margin: overview.profit_margin,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company,
        overview,
        quote,
        financials,
      },
    });
  });

  getChartData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker } = req.params;
    const { interval = 'daily' } = req.query;

    let chartData;

    if (interval === 'intraday') {
      chartData = await marketDataService.getIntradayData(ticker.toUpperCase(), '5min');
    } else {
      chartData = await marketDataService.getDailyData(ticker.toUpperCase(), 'compact');
    }

    res.status(200).json({
      success: true,
      data: chartData,
    });
  });
}

export default new StockController();
