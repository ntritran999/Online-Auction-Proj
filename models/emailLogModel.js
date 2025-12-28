import supabase from '../supabaseClient.js';

// Ghi log email đã gửi
export async function logEmail(productId, emailType, sentTo) {
    const { data, error } = await supabase
        .from('auction_email_logs')
        .insert({
            product_id: productId,
            email_type: emailType,
            sent_to: sentTo
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error logging email:', error);
        return null;
    }
    
    return data;
}

// Lấy lịch sử email đã gửi cho một sản phẩm
export async function getEmailLogs(productId) {
    const { data, error } = await supabase
        .from('auction_email_logs')
        .select('*')
        .eq('product_id', productId)
        .order('sent_at', { ascending: false });
    
    return { data, error };
}

export async function markAuctionEmailSent(product_id) {
  try {
    await supabase
      .from('products')
      .update({ auction_email_sent: true })
      .eq('product_id', product_id);
  } catch (err) {
    console.error("markAuctionEmailSent error:", err);
  }
}