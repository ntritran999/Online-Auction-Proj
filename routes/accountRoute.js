import { Router } from "express";
import * as accountController from '../controllers/profileController.js';

const router = Router();

// Thông tin cá nhân
router.get('/profile', accountController.getEditProfile);
router.post('/profile/edit', accountController.postEditProfile);

// OTP đổi mật khẩu
router.post('/profile/send-otp', accountController.sendPasswordResetOTP);
router.post('/profile/change-password-otp', accountController.postChangePasswordWithOTP);


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

router.get('/selling', accountController.getSellingProducts);

router.get('/transactions', accountController.getProductsWithBidWon);

export default router;