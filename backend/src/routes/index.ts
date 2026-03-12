import { Router } from 'express';
import authRoutes from './authRoutes';
import stockRoutes from './stockRoutes';
import marketRoutes from './marketRoutes';
import aiRoutes from './aiRoutes';
import screenerRoutes from './screenerRoutes';
import watchlistRoutes from './watchlistRoutes';
import earningsRoutes from './earningsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stocks', stockRoutes);
router.use('/market', marketRoutes);
router.use('/ai', aiRoutes);
router.use('/screener', screenerRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/earnings', earningsRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'InvestIQ API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
