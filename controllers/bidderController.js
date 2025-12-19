import * as bidderModel from '../models/bidderModel.js';
import * as productModel from '../models/productModel.js';
import * as userModel from '../models/userModel.js';

// Thêm/Xóa sản phẩm khỏi watchlist
export const toggleWatchlist = async (req, res) => {
    const userId = req.user.user_id;
    const productId = req.params.productId;

    try {
        // Kiểm tra sản phẩm có tồn tại không
        const product = await productModel.findProById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sản phẩm không tồn tại' 
            });
        }

        // Kiểm tra đã có trong watchlist chưa
        const inWatchlist = await bidderModel.checkInWatchlist(userId, productId);

        if (inWatchlist) {
            // Xóa khỏi watchlist
            const result = await bidderModel.removeFromWatchlist(userId, productId);
            if (result) {
                return res.json({ 
                    success: true, 
                    action: 'removed',
                    message: 'Đã xóa khỏi danh sách yêu thích' 
                });
            }
        } else {
            // Thêm vào watchlist
            const result = await bidderModel.addToWatchlist(userId, productId);
            if (result) {
                return res.json({ 
                    success: true, 
                    action: 'added',
                    message: 'Đã thêm vào danh sách yêu thích' 
                });
            }
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra' 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server' 
        });
    }
};

// Lấy danh sách watchlist
export const getWatchlist = async (req, res) => {
    const userId = req.user.user_id;
    
    try {
        const watchlist = await bidderModel.getWatchlistByUser(userId);
        
        res.render('vwBidder/watchlist', {
            watchlist: watchlist,
            title: 'Danh sách yêu thích'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi tải danh sách yêu thích');
    }
};

// Ra giá
export const placeBid = async (req, res) => {

    const userId = req.user.user_id;
    const { productId, bidAmount, buyNow } = req.body;

    try {
        // Lấy thông tin sản phẩm
        const product = await productModel.findProById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sản phẩm không tồn tại' 
            });
        }

        // Kiểm tra phiên đấu giá đã kết thúc chưa
        const now = new Date();
        const endTime = new Date(product.end_time);
        if (now >= endTime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phiên đấu giá đã kết thúc' 
            });
        }

        // Không cho phép người bán tự ra giá
        if (product.seller_id === userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Người bán không thể ra giá sản phẩm của mình' 
            });
        }

        const highestBid = await bidderModel.getCurrentHighestBid(productId);

        if (!buyNow && highestBid && highestBid.bidder_id === userId) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đang là người giữ giá cao nhất nên không cần đặt giá.'
            });
        }

        // Kiểm tra điều kiện bidder
        const eligibility = await bidderModel.checkBidderEligibility(userId, !product.bidder_rating_required);
        if (!eligibility.eligible) {
            return res.status(403).json({ 
                success: false, 
                message: eligibility.reason 
            });
        }

        // Kiểm tra giá hợp lệ
        let minBid = parseFloat(product.current_price);
        if (product.bid_count > 0) {
            minBid += parseFloat(product.step_price);
        }
        const bidAmountNum = parseFloat(bidAmount);

        if (bidAmountNum < minBid) {
            return res.status(400).json({ 
                success: false, 
                message: `Giá đặt phải lớn hơn hoặc bằng ${minBid.toLocaleString('vi-VN')} VNĐ` 
            });
        }

        // Đặt bid
        let bid;
        if (buyNow) {
            bid = await bidderModel.placeBuyNowBid(productId, userId, bidAmountNum);
        }
        else {
            bid = await bidderModel.autoBid(productId, userId, bidAmountNum);
        }
        if (!bid) {
            return res.status(500).json({ 
                success: false, 
                message: 'Không thể đặt giá' 
            });
        }

        // Cập nhật thông tin sản phẩm
        const updated = await bidderModel.updateProductAfterBid(
            bid.product_id,
            bid.bid_amount,
            bid.bidder_id
        );

        if (!updated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Có lỗi khi cập nhật sản phẩm' 
            });
        }

        return res.json({ 
            success: true, 
            message: 'Đặt giá thành công',
            newPrice: bid.bid_amount,
            bidCount: product.bid_count + 1
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server' 
        });
    }
};

// Xem lịch sử đấu giá
export const getBidHistory = async (req, res) => {
    const productId = req.params.productId;
    const previousPage = req.headers.referer || `/product/details/${productId}`;
    try {
        const product = await productModel.findProById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sản phẩm không tồn tại' 
            });
        }

        const history = await bidderModel.getBidHistory(productId);
        
        // Format data cho view
        const formattedHistory = history.map(bid => ({
            created_at: bid.created_at,
            bidder_name: bid.bidder.full_name,
            bid_amount: bid.bid_amount,
            rating_plus: bid.bidder.rating_plus,
            rating_minus: bid.bidder.rating_minus,
            total_rating: bid.bidder.rating_plus + bid.bidder.rating_minus
        }));

        if (req.query.format === 'json') {
            return res.json({ 
                success: true, 
                history: formattedHistory 
            });
        }

        res.render('vwBidder/bid_history', {
            product: product,
            history: formattedHistory,
            previousPage,
            title: 'Lịch sử đấu giá'
        });

    } catch (error) {
        console.error(error);
        if (req.query.format === 'json') {
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server' 
            });
        }
        res.status(500).send('Lỗi khi tải lịch sử đấu giá');
    }
};

// Kiểm tra trạng thái watchlist (dùng cho hiển thị icon)
export const checkWatchlistStatus = async (req, res) => {

    const userId = req.user.user_id;
    const productId = req.params.productId;

    try {
        const inWatchlist = await bidderModel.checkInWatchlist(userId, productId);
        return res.json({ inWatchlist });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Lỗi server' });
    }
};