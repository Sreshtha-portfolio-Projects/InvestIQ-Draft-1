import { Router } from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:companyId', removeFromWatchlist);

export default router;
