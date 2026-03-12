import { Router } from 'express';
import { z } from 'zod';
import {
  askResearchAssistant,
  screenStocks,
  analyzeEarnings,
  getEarningsAnalysis,
} from '../controllers/aiController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit AI endpoints to prevent abuse
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, error: 'Too many AI requests. Please wait a moment.' },
});

const researchSchema = z.object({
  question: z.string().min(3).max(500),
  ticker: z.string().optional(),
});

const screenerSchema = z.object({
  query: z.string().min(3).max(300),
});

const earningsSchema = z.object({
  companyId: z.string().uuid(),
  transcriptId: z.string().uuid().optional(),
  transcript: z.string().min(100).optional(),
});

router.post('/research', aiRateLimit, optionalAuth, validateBody(researchSchema), askResearchAssistant);
router.post('/screen', aiRateLimit, validateBody(screenerSchema), screenStocks);
router.post('/earnings/analyze', aiRateLimit, authenticate, validateBody(earningsSchema), analyzeEarnings);
router.get('/earnings/:companyId', optionalAuth, getEarningsAnalysis);

export default router;
