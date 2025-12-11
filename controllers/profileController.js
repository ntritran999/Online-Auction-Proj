import * as profileModel from '../models/profileModel.js';
import * as proModel from '../models/productModel.js';

// Trang cập nhật thông tin cá nhân
export const getEditProfile = async (req, res) => {
    const userId = req.user.user_id;
    const user = await profileModel.getUserById(userId);
    
    res.render('vwProfile/edit', {
        layout: 'profile',
        user: user,
        title: 'Cập nhật thông tin cá nhân'
    });
};

// Xử lý cập nhật thông tin
export const postEditProfile = async (req, res) => {
    const userId = req.user.user_id;
    const { full_name, email, address } = req.body;
    
    const updated = await profileModel.updateUserInfo(userId, { full_name, email, address });
    
    if (updated) {
        return res.json({ success: true, message: 'Cập nhật thông tin thành công' });
    }
    
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
};

// Xử lý đổi mật khẩu
export const postChangePassword = async (req, res) => {
    const userId = req.user.user_id;
    const { old_password, new_password, confirm_password } = req.body;
    
    // Validate
    if (!old_password || !new_password || !confirm_password) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    if (new_password !== confirm_password) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới không khớp' });
    }
    
    if (new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    const result = await profileModel.changePassword(userId, old_password, new_password);
    
    if (result.success) {
        return res.json(result);
    }
    
    return res.status(400).json(result);
};

// Xem đánh giá
export const getRatings = async (req, res) => {    
    const userId = req.user.user_id;
    const user = await profileModel.getUserById(userId);
    const ratings = await profileModel.getUserRatings(userId);
    
    // Tính toán thống kê
    const totalRatings = user.rating_plus + user.rating_minus;
    const positivePercentage = totalRatings > 0 
        ? Math.round((user.rating_plus / totalRatings) * 100) 
        : 0;
    
    res.render('vwProfile/ratings', {
        layout: 'profile',
        user: user,
        ratings: ratings,
        totalRatings: totalRatings,
        positivePercentage: positivePercentage,
        title: 'Xem đánh giá'
    });
};

// Danh sách sản phẩm yêu thích
export const getWatchlist = async (req, res) => {
    const userId = req.user.user_id;
    const watchlist = await profileModel.getUserWatchlist(userId);
    
    res.render('vwBidder/watchlist', {
        layout: 'profile',
        watchlist: watchlist,
        title: 'Danh sách sản phẩm yêu thích'
    });
};

// Danh sách sản phẩm đang đấu giá
export const getBiddingProducts = async (req, res) => {
    const userId = req.user.user_id;
    const products = await profileModel.getUserBiddingProducts(userId);
    
    res.render('vwProfile/bidding', {
        layout: 'profile',
        products: products,
        title: 'Danh sách sản phẩm đang đấu giá'
    });
};

// Danh sách sản phẩm đã thắng
export const getWonProducts = async (req, res) => {
    const userId = req.user.user_id;
    const products = await profileModel.getUserWonProducts(userId);
    
    res.render('vwProfile/won', {
        layout: 'profile',
        products: products,
        title: 'Danh sách sản phẩm thắng đấu giá'
    });
};

// Xin upgrade lên seller
export const getUpgradeRequest = async (req, res) => {
    const userId = req.user.user_id;
    const existingRequest = await profileModel.getUpgradeRequestStatus(userId);
    
    res.render('vwProfile/upgrade', {
        layout: 'profile',
        existingRequest: existingRequest,
        title: 'Yêu cầu nâng cấp tài khoản'
    });
};

export const postUpgradeRequest = async (req, res) => {
    const userId = req.user.user_id;
    const { note } = req.body;
    
    if (!note || note.trim().length < 10) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vui lòng nhập lý do (ít nhất 10 ký tự)' 
        });
    }
    
    const result = await profileModel.requestUpgrade(userId, note);
    
    if (result.success) {
        return res.json(result);
    }
    
    return res.status(400).json(result);
};

export const getSellingProducts = async (req, res) => {
    const list = await proModel.findProsBySeller(req.user.user_id);
    res.render('vwProfile/selling_products', {
        layout: 'profile',
        products: list,
    })
};

export const getProductsWithBidWon = async (req, res) => {
    const list = await proModel.findProsWithTxnBySeller(req.user.user_id);
    res.render('vwProfile/transactions', {
        layout: 'profile',
        products: list,
    })
};