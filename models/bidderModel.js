import supabase from '../supabaseClient.js';

// Kiểm tra sản phẩm đã có trong watchlist chưa
export async function checkInWatchlist(userId, productId) {
    const { data, error } = await supabase
        .from('watchlist')
        .select('watch_id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();
    
    return data !== null;
}

// Thêm sản phẩm vào watchlist
export async function addToWatchlist(userId, productId) {
    const { data, error } = await supabase
        .from('watchlist')
        .insert({
            user_id: userId,
            product_id: productId
        })
        .select()
        .single();
    
    if (error) {
        console.log(error);
        return null;
    }
    return data;
}

// Xóa sản phẩm khỏi watchlist
export async function removeFromWatchlist(userId, productId) {
    const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
    
    if (error) {
        console.log(error);
        return false;
    }
    return true;
}

// Lấy danh sách watchlist của user
export async function getWatchlistByUser(userId) {
    const { data, error } = await supabase
        .from('watchlist')
        .select(`
            *,
            product:products!product_id(
                *,
                highest_bidder:users!highest_bidder(
                    full_name
                ),
                image_list:productimages!product_id(
                    image_url
                )
            )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
    
    if (error) {
        console.log(error);
        return [];
    }
    return data;
}

// Thêm bid mới
export async function placeBid(productId, bidderId, bidAmount) {
    const { data, error } = await supabase
        .from('bids')
        .insert({
            product_id: productId,
            bidder_id: bidderId,
            bid_amount: bidAmount
        })
        .select()
        .single();
    
    if (error) {
        console.log(error);
        return null;
    }
    return data;
}

// Cập nhật thông tin sản phẩm sau khi bid
export async function updateProductAfterBid(productId, newPrice, bidderId) {
    const { error } = await supabase
        .from('products')
        .update({
            current_price: newPrice,
            highest_bidder: bidderId,
            bid_count: supabase.raw('bid_count + 1')
        })
        .eq('product_id', productId);
    
    if (error) {
        console.log(error);
        return false;
    }
    return true;
}

// Lấy lịch sử đấu giá của sản phẩm
export async function getBidHistory(productId) {
    const { data, error } = await supabase
        .from('bids')
        .select(`
            *,
            bidder:users!bidder_id(
                full_name,
                rating_plus,
                rating_minus
            )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.log(error);
        return [];
    }
    return data;
}

// Kiểm tra bidder có đủ điều kiện ra giá không
export async function checkBidderEligibility(userId, allowNewBidder = false) {
    const { data, error } = await supabase
        .from('users')
        .select('rating_plus, rating_minus')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.log(error);
        return { eligible: false, reason: 'Không thể kiểm tra thông tin người dùng' };
    }
    
    const totalRating = data.rating_plus + data.rating_minus;
    
    // Nếu chưa có đánh giá
    if (totalRating === 0) {
        if (allowNewBidder) {
            return { eligible: true, reason: 'Người bán cho phép bidder mới' };
        } else {
            return { eligible: false, reason: 'Người bán không cho phép bidder chưa có đánh giá' };
        }
    }
    
    // Tính phần trăm đánh giá tích cực
    const positiveRate = (data.rating_plus / totalRating) * 100;
    
    if (positiveRate >= 80) {
        return { eligible: true, reason: `Điểm đánh giá: ${positiveRate.toFixed(0)}%` };
    } else {
        return { eligible: false, reason: `Điểm đánh giá ${positiveRate.toFixed(0)}% không đủ 80%` };
    }
}

// Lấy thông tin bid cao nhất hiện tại
export async function getCurrentHighestBid(productId) {
    const { data, error } = await supabase
        .from('bids')
        .select('bid_amount, bidder_id')
        .eq('product_id', productId)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.log(error);
    }
    
    return data;
}