import { Router } from 'express';
import stockController from '../controllers/stockController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/search', optionalAuth, stockController.search);

router.get('/:ticker/quote', optionalAuth, stockController.getQuote);

router.get('/:ticker/overview', optionalAuth, stockController.getOverview);

router.get('/:ticker/chart', optionalAuth, stockController.getChartData);

export default router;
