import { Router } from 'express';
import { body } from 'express-validator';
import screenerController from '../controllers/screenerController';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.post('/screen', optionalAuth, screenerController.screen);

router.post(
  '/interpret',
  optionalAuth,
  validate([body('query').notEmpty().withMessage('Query is required')]),
  screenerController.interpretQuery
);

export default router;
