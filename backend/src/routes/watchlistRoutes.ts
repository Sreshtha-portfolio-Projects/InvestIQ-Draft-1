import { Router } from 'express';
import { body } from 'express-validator';
import watchlistController from '../controllers/watchlistController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.get('/', authenticate, watchlistController.getWatchlist);

router.post(
  '/',
  authenticate,
  validate([body('ticker').notEmpty().withMessage('Ticker is required')]),
  watchlistController.addToWatchlist
);

router.delete('/:ticker', authenticate, watchlistController.removeFromWatchlist);

router.get('/:ticker/check', authenticate, watchlistController.checkWatchlist);

export default router;
