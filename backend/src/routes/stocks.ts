import { Router } from 'express';
import { searchStocks, getStockDetail, getMarketDashboard } from '../controllers/stockController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/stocks/market:
 *   get:
 *     summary: Get market dashboard overview
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Market overview data
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
 *                     indices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StockQuote'
 *                     topGainers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StockQuote'
 *                     topLosers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StockQuote'
 *                     mostActive:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StockQuote'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/market', getMarketDashboard);

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: Search for stocks by symbol or name
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query (ticker symbol or company name)
 *         example: TCS
 *     responses:
 *       200:
 *         description: Search results
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
 *                       ticker:
 *                         type: string
 *                         example: NSE:TCS
 *                       name:
 *                         type: string
 *                         example: Tata Consultancy Services
 *                       exchange:
 *                         type: string
 *                         example: NSE
 *                       sector:
 *                         type: string
 *                         example: IT Services
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', optionalAuth, searchStocks);

/**
 * @swagger
 * /api/stocks/{ticker}:
 *   get:
 *     summary: Get detailed stock information
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock ticker symbol
 *         example: NSE:TCS
 *     responses:
 *       200:
 *         description: Stock details
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
 *                     ticker:
 *                       type: string
 *                       example: NSE:TCS
 *                     name:
 *                       type: string
 *                       example: Tata Consultancy Services
 *                     price:
 *                       type: number
 *                       example: 3450.50
 *                     change:
 *                       type: number
 *                       example: 25.30
 *                     changePercent:
 *                       type: number
 *                       example: 0.74
 *                     volume:
 *                       type: number
 *                     marketCap:
 *                       type: number
 *                     pe:
 *                       type: number
 *                     dividend:
 *                       type: number
 *                     high:
 *                       type: number
 *                     low:
 *                       type: number
 *                     open:
 *                       type: number
 *                     previousClose:
 *                       type: number
 *       404:
 *         description: Stock not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:ticker', optionalAuth, getStockDetail);

export default router;
