import { Router } from 'express';
import { body } from 'express-validator';
import earningsController from '../controllers/earningsController';
import { optionalAuth, authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.get('/:ticker', optionalAuth, earningsController.getTranscripts);

router.post(
  '/',
  authenticate,
  validate([
    body('ticker').notEmpty().withMessage('Ticker is required'),
    body('quarter').notEmpty().withMessage('Quarter is required'),
    body('year').isInt().withMessage('Year must be a number'),
    body('transcript_text').notEmpty().withMessage('Transcript text is required'),
  ]),
  earningsController.uploadTranscript
);

router.get('/:id/analyze', optionalAuth, earningsController.analyzeTranscript);

router.get('/:id/summary', optionalAuth, earningsController.summarizeTranscript);

export default router;
