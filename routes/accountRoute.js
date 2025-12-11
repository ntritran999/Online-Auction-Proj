import { Router } from "express";
import * as accountController from '../controllers/profileController.js';
import * as proModel from '../models/productModel.js';

const router = Router();


// Thông tin cá nhân
router.get('/profile', accountController.getEditProfile);
router.post('/profile/edit', accountController.postEditProfile);
router.post('/profile/change-password', accountController.postChangePassword);

// Đánh giá
router.get('/ratings', accountController.getRatings);

// watchlist
router.get('/watchlist', accountController.getWatchlist);

// Sản phẩm đang đấu giá
router.get('/bidding', accountController.getBiddingProducts);

// Sản phẩm đã thắng
router.get('/won', accountController.getWonProducts);

// bidder to seller
router.get('/upgrade-request', accountController.getUpgradeRequest);
router.post('/upgrade-request', accountController.postUpgradeRequest);

router.get('/selling', async (req, res) => {
    const list = await proModel.findProsBySeller(req.user.user_id);
    res.render('vwProfile/selling_products', {
        layout: 'profile',
        products: list,
    })
})

export default router;