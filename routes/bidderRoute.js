import { Router } from 'express';
import { 
    toggleWatchlist, 
    getWatchlist, 
    placeBid, 
    getBidHistory,
    checkWatchlistStatus 
} from '../controllers/bidderController.js';

const router = Router();

// watchlist 
router.post('/watchlist/toggle/:productId', toggleWatchlist);
router.get('/watchlist', getWatchlist);
router.get('/watchlist/check/:productId', checkWatchlistStatus);

// bidding 
router.post('/bid', placeBid);

// bid history 
router.get('/bid-history/:productId', getBidHistory);

export default router;