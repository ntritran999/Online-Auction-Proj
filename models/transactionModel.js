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