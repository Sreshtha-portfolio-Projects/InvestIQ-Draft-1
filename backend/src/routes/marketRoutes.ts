import { Router } from 'express';
import marketController from '../controllers/marketController';

const router = Router();

router.get('/dashboard', marketController.getDashboard);

router.get('/indices', marketController.getIndices);

router.get('/gainers', marketController.getTopGainers);

router.get('/losers', marketController.getTopLosers);

router.get('/trending', marketController.getTrending);

export default router;
