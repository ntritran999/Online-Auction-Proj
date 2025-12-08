import { Router } from 'express';
import { 
    toggleWatchlist, 
    getWatchlist, 
    placeBid, 
    getBidHistory,
    checkWatchlistStatus 
} from '../controllers/bidderController.js';

const router = Router();

// 2.1 Watchlist routes
router.post('/watchlist/toggle/:productId', toggleWatchlist);
router.get('/watchlist', getWatchlist);
router.get('/watchlist/check/:productId', checkWatchlistStatus);

// 2.2 Bidding routes
router.post('/bid', placeBid);

// 2.3 Bid history routes
router.get('/bid-history/:productId', getBidHistory);

export default router;