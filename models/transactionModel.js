import supabase from "../supabaseClient.js";

export async function findTransactionByPro(proId) {
    const { data, error } = await supabase
                                .from('transactions')
                                .select()
                                .eq('product_id', proId)
                                .single();
    return data;
}

export async function findMessagesByTranx(txnId) {
    const { data, error } = await supabase
                                .from('chatmessages')
                                .select()
                                .eq('transaction_id', txnId);
    return data;
}

export async function createMsg(msg) {
    const { error } = await supabase
                            .from('chatmessages')
                            .insert(msg);
    if (error)
        console.log(error);
}

export async function updateCancelTxn(txn_id) {
    const { error } = await supabase
                            .from('transactions')
                            .update({ is_canceled: true })
                            .eq('transaction_id', txn_id);
    if (error)
        console.log(error);
}

export async function updateTxnStatus(txn_id, status) {
    const { error } = await supabase
                            .from('transactions')
                            .update({ payment_status: status })
                            .eq('transaction_id', txn_id);
    if (error)
        console.log(error);
}

export async function updateTxnPaymentInfo(txn_id, address, invoice_url) {
    const { error } = await supabase
                            .from('transactions')
                            .update({ 
                                invoice_url: invoice_url,
                                shipping_address: address,
                                payment_status: 'Đã thanh toán' 
                            })
                            .eq('transaction_id', txn_id);
    if (error)
        console.log(error);
}

export async function findRating(proId, sender, receiver) {
    const { data, error } = await supabase
                                .from('ratings')
                                .select()
                                .eq('product_id', proId)
                                .eq('rater_id', sender)
                                .eq('target_id', receiver)
                                .single();

    return data;
}

export async function addRating(rating) {
    const { error } = await supabase
                            .from('ratings')
                            .insert(rating);
    if (error)
        console.log(error);
}

export async function updateRating(ratingId, value, comment) {
    const { error } = await supabase
                            .from('ratings')
                            .update({ rating_value: value, comment: comment })
                            .eq('rating_id', ratingId);
    if (error)
        console.log(error);
}