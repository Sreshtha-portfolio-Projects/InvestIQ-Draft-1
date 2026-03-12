import { Router } from 'express';
import { body } from 'express-validator';
import aiController from '../controllers/aiController';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.post(
  '/analyze',
  optionalAuth,
  validate([body('ticker').notEmpty().withMessage('Ticker is required')]),
  aiController.analyzeStock
);

router.post(
  '/compare',
  optionalAuth,
  validate([
    body('ticker1').notEmpty().withMessage('Ticker 1 is required'),
    body('ticker2').notEmpty().withMessage('Ticker 2 is required'),
  ]),
  aiController.compareStocks
);

router.post(
  '/chat',
  optionalAuth,
  validate([body('query').notEmpty().withMessage('Query is required')]),
  aiController.chat
);

export default router;
