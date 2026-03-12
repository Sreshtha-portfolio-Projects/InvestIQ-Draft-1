import { Request, Response, NextFunction } from 'express';
import { EarningsTranscriptRepository, CompanyRepository } from '../db/repositories';
import earningsAnalyzer from '../ai/earningsAnalyzer';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';

const earningsRepo = new EarningsTranscriptRepository();
const companyRepo = new CompanyRepository();

export class EarningsController {
  getTranscripts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker } = req.params;

    const company = await companyRepo.findByTicker(ticker.toUpperCase());

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const transcripts = await earningsRepo.findByCompanyId(company.id);

    res.status(200).json({
      success: true,
      data: transcripts,
    });
  });

  uploadTranscript = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { ticker, quarter, year, transcript_text } = req.body;

    if (!ticker || !quarter || !year || !transcript_text) {
      throw ApiError.badRequest('All fields are required');
    }

    let company = await companyRepo.findByTicker(ticker.toUpperCase());

    if (!company) {
      company = await companyRepo.create({
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
        sector: 'Unknown',
        market_cap: 0,
      });
    }

    const transcript = await earningsRepo.create({
      company_id: company.id,
      quarter,
      year: parseInt(year),
      transcript_text,
    });

    res.status(201).json({
      success: true,
      data: transcript,
    });
  });

  analyzeTranscript = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const transcript = await earningsRepo.findById(id);

    if (!transcript) {
      throw ApiError.notFound('Transcript not found');
    }

    const analysis = await earningsAnalyzer.analyzeTranscript(
      transcript.company_id,
      transcript.quarter,
      transcript.transcript_text
    );

    res.status(200).json({
      success: true,
      data: analysis,
    });
  });

  summarizeTranscript = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const transcript = await earningsRepo.findById(id);

    if (!transcript) {
      throw ApiError.notFound('Transcript not found');
    }

    const summary = await earningsAnalyzer.summarizeEarnings(transcript.transcript_text);

    res.status(200).json({
      success: true,
      data: {
        summary,
      },
    });
  });
}

export default new EarningsController();
