import { Router } from 'express';
import { searchStocks, getStockDetail, getMarketDashboard } from '../controllers/stockController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/market', getMarketDashboard);
router.get('/search', optionalAuth, searchStocks);
router.get('/:ticker', optionalAuth, getStockDetail);

export default router;
