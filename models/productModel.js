import supabase from '../supabaseClient.js'

export async function findAllByCatId(catId) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .eq('category_id', catId);
    return data;
}

export async function findProById(id) {
    const { data, error } = await supabase.from('products').select().eq('product_id', id).single();
    if (error)
        return null;
    return data;
}

export async function findTopProsByColumn(column, numPros) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .order(column, { 'ascending': false })
                                .limit(numPros);
    return data;
}

export async function findLimitedProsByCatId(catId, numPros) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .eq('category_id', catId)
                                .order('created_at', { 'ascending': false })
                                .limit(numPros);
    return data;
}