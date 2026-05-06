import { Router } from 'express';
import { z } from 'zod';
import {
  askResearchAssistant,
  routeAiQuery,
  screenStocks,
  classifyIntent,
  analyzeEarnings,
  getEarningsAnalysis,
  relativeValuation,
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

const intentSchema = z.object({
  query: z.string().min(3).max(500),
});

const screenerSchema = z.object({
  query: z.string().min(3).max(300),
});

const peerRangeSchema = z
  .object({
    min: z.number(),
    max: z.number(),
  })
  .optional();

const relativeValuationSchema = z
  .object({
    company_name: z.string().min(1).max(200),
    current_pe: z.number().positive(),
    historical_pe_range: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }),
    historical_median_pe: z.number().positive(),
    peer_pe_range: peerRangeSchema,
    revenue_growth: z.number(),
    roe: z.number(),
    sector: z.string().min(1).max(120),
  })
  .refine((d) => d.historical_pe_range.min <= d.historical_pe_range.max, {
    message: 'historical_pe_range.min must be <= max',
    path: ['historical_pe_range'],
  })
  .refine((d) => d.peer_pe_range == null || d.peer_pe_range.min <= d.peer_pe_range.max, {
    message: 'peer_pe_range.min must be <= max',
    path: ['peer_pe_range'],
  });

const earningsSchema = z.object({
  companyId: z.string().uuid(),
  transcriptId: z.string().uuid().optional(),
  transcript: z.string().min(100).optional(),
});

/**
 * @swagger
 * /api/ai/research:
 *   post:
 *     summary: Ask AI research assistant about stocks
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *                 example: What is the revenue growth of TCS in the last 3 years?
 *               ticker:
 *                 type: string
 *                 example: NSE:TCS
 *     responses:
 *       200:
 *         description: AI research response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResearchResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/research', aiRateLimit, optionalAuth, validateBody(researchSchema), askResearchAssistant);

/**
 * @swagger
 * /api/ai/query:
 *   post:
 *     summary: Classify intent and run screener, valuation, research, or comparison
 *     tags: [AI]
 */
router.post('/query', aiRateLimit, optionalAuth, validateBody(researchSchema), routeAiQuery);

/**
 * @swagger
 * /api/ai/valuation/relative:
 *   post:
 *     summary: Relative P/E valuation vs history (rules + context), not absolute PE screens
 *     tags: [AI]
 */
router.post(
  '/valuation/relative',
  aiRateLimit,
  optionalAuth,
  validateBody(relativeValuationSchema),
  relativeValuation
);

/**
 * @swagger
 * /api/ai/screen:
 *   post:
 *     summary: Screen stocks using natural language query
 *     description: Use AI to find stocks matching your criteria in plain English
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 300
 *                 example: Find technology stocks with PE ratio less than 20 and market cap above 100 billion
 *     responses:
 *       200:
 *         description: Screener results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ScreenerResult'
 *                     query:
 *                       type: string
 *                     interpretation:
 *                       type: string
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/screen', aiRateLimit, validateBody(screenerSchema), screenStocks);

/**
 * @swagger
 * /api/ai/intent:
 *   post:
 *     summary: Classify user query intent (screener vs analysis vs valuation vs comparison)
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Intent classification result
 */
router.post('/intent', aiRateLimit, validateBody(intentSchema), classifyIntent);

/**
 * @swagger
 * /api/ai/earnings/analyze:
 *   post:
 *     summary: Analyze earnings call transcript with AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               transcriptId:
 *                 type: string
 *                 format: uuid
 *               transcript:
 *                 type: string
 *                 minLength: 100
 *                 description: Raw earnings call transcript text
 *     responses:
 *       200:
 *         description: Earnings analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                     keyInsights:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, neutral, negative]
 *                     risks:
 *                       type: array
 *                       items:
 *                         type: string
 *                     opportunities:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/earnings/analyze', aiRateLimit, authenticate, validateBody(earningsSchema), analyzeEarnings);

/**
 * @swagger
 * /api/ai/earnings/{companyId}:
 *   get:
 *     summary: Get past earnings analyses for a company
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company UUID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Past earnings analyses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       companyId:
 *                         type: string
 *                         format: uuid
 *                       quarter:
 *                         type: string
 *                       year:
 *                         type: number
 *                       summary:
 *                         type: string
 *                       sentiment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/earnings/:companyId', optionalAuth, getEarningsAnalysis);

export default router;
