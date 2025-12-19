import supabase from '../supabaseClient.js';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

// Lấy thông tin user
export async function getUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.log(error);
        return null;
    }
    return data;
}

// Cập nhật thông tin cá nhân (không password)
export async function updateUserInfo(userId, { full_name, email, address }) {
    const { data, error } = await supabase
        .from('users')
        .update({ full_name, email, address })
        .eq('user_id', userId)
        .select()
        .single();
    
    if (error) {
        console.log(error);
        return null;
    }
    return data;
}

// Đổi mật khẩu
export async function changePassword(userId, oldPassword, newPassword) {
    // Lấy password hiện tại
    const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('user_id', userId)
        .single();
    
    if (error || !user) {
        return { success: false, message: 'Không tìm thấy người dùng' };
    }
    
    // Kiểm tra mật khẩu cũ
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
        return { success: false, message: 'Mật khẩu cũ không đúng' };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('user_id', userId);
    
    if (updateError) {
        console.log(updateError);
        return { success: false, message: 'Có lỗi xảy ra khi đổi mật khẩu' };
    }
    
    return { success: true, message: 'Đổi mật khẩu thành công' };
}

// Lấy danh sách đánh giá của user
export async function getUserRatings(userId) {
    const { data, error } = await supabase
        .from('ratings')
        .select(`
            *,
            rater:users!rater_id(full_name),
            product:products!product_id(product_name)
        `)
        .eq('target_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.log(error);
        return [];
    }
    return data;
}

// Lấy danh sách sản phẩm yêu thích
export async function getUserWatchlist(userId) {
    const { data, error } = await supabase
        .from('watchlist')
        .select(`
            *,
            product:products!product_id(
                *,
                highest_bidder:users!highest_bidder(full_name),
                image_list:productimages!product_id(image_url)
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

// Lấy danh sách sản phẩm đang tham gia đấu giá
export async function getUserBiddingProducts(userId) {
    const { data, error } = await supabase
        .from('bids')
        .select(`
            product_id,
            products(
                *,
                highest_bidder:users!highest_bidder(full_name),
                image_list:productimages!product_id(image_url)
            )
        `)
        .eq('bidder_id', userId)
        .gt('products.end_time', dayjs().format())
        .order('created_at', { ascending: false });
    
    if (error) {
        console.log(error);
        return [];
    }
    
    // Lọc unique products
    const uniqueProducts = [];
    const seenIds = new Set();
    
    for (const item of data) {
        if (item.products && !seenIds.has(item.products.product_id)) {
            uniqueProducts.push(item.products);
            seenIds.add(item.products.product_id);
        }
    }
    
    return uniqueProducts;
}

// Lấy danh sách sản phẩm đã thắng đấu giá
export async function getUserWonProducts(userId) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            seller:users!seller_id(full_name),
            image_list:productimages!product_id(image_url)
        `)
        .eq('highest_bidder', userId)
        .lt('end_time', dayjs().format())
        .order('end_time', { ascending: false });
    
    if (error) {
        console.log(error);
        return [];
    }
    return data;
}

// Đánh giá người bán
export async function rateSeller(productId, bidderId, sellerId, ratingValue, comment) {
    // Kiểm tra đã đánh giá chưa
    const { data: existingRating } = await supabase
        .from('ratings')
        .select('rating_id')
        .eq('product_id', productId)
        .eq('rater_id', bidderId)
        .eq('target_id', sellerId)
        .single();
    
    if (existingRating) {
        return { success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' };
    }
    
    // Thêm đánh giá
    const { error: insertError } = await supabase
        .from('ratings')
        .insert({
            rater_id: bidderId,
            target_id: sellerId,
            product_id: productId,
            rating_value: ratingValue,
            comment: comment
        });
    
    if (insertError) {
        console.log(insertError);
        return { success: false, message: 'Có lỗi xảy ra khi đánh giá' };
    }
    
    // Cập nhật rating của seller
    if (ratingValue === 1) {
        await supabase.rpc('increment', { 
            table_name: 'users',
            column_name: 'rating_plus',
            row_id: sellerId 
        });
        
        // Fallback nếu function không tồn tại
        const { data: seller } = await supabase
            .from('users')
            .select('rating_plus')
            .eq('user_id', sellerId)
            .single();
        
        if (seller) {
            await supabase
                .from('users')
                .update({ rating_plus: seller.rating_plus + 1 })
                .eq('user_id', sellerId);
        }
    } else {
        await supabase.rpc('increment', { 
            table_name: 'users',
            column_name: 'rating_minus',
            row_id: sellerId 
        });
        
        // Fallback
        const { data: seller } = await supabase
            .from('users')
            .select('rating_minus')
            .eq('user_id', sellerId)
            .single();
        
        if (seller) {
            await supabase
                .from('users')
                .update({ rating_minus: seller.rating_minus + 1 })
                .eq('user_id', sellerId);
        }
    }
    
    return { success: true, message: 'Đánh giá thành công' };
}

// Gửi yêu cầu upgrade lên seller
export async function requestUpgrade(userId, note) {
    // Kiểm tra đã gửi yêu cầu chưa
    const { data: existing } = await supabase
        .from('upgrade_requests')
        .select('request_id, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (existing && existing.status === 'pending') {
        return { success: false, message: 'Bạn đã có yêu cầu đang chờ xử lý' };
    }
    
    // Tạo yêu cầu mới
    const { error } = await supabase
        .from('upgrade_requests')
        .insert({
            user_id: userId,
            note: note,
            status: 'pending'
        });
    
    if (error) {
        console.log(error);
        return { success: false, message: 'Có lỗi xảy ra khi gửi yêu cầu' };
    }
    
    return { success: true, message: 'Gửi yêu cầu thành công. Admin sẽ xem xét trong vòng 7 ngày' };
}

// Kiểm tra trạng thái upgrade request
export async function getUpgradeRequestStatus(userId) {
    const { data, error } = await supabase
        .from('upgrade_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (error) {
        return null;
    }
    return data;
}