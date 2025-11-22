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
                                .order(column, { ascending: false })
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
                                .order('created_at', { ascending: false })
                                .limit(numPros);
    return data;
}

export async function findPageByCatId(catId, numPros, offset) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .eq('category_id', catId)
                                .range(offset, offset + numPros - 1);
    return data;
}

export async function findPageBySearch(searchValue, numPros, offset) {
    const unaccent_search = await supabase.rpc('immutable_unaccent', { word: searchValue });
    const { data, error } = await supabase
                                .from('products')
                                .select()
                                .textSearch('fts', unaccent_search.data)
                                .gt('end_time', new Date().toISOString())
                                .range(offset, offset + numPros - 1);
    return data;
}

export async function countProsByCatId(catId) {
    const { count } = await supabase
                        .from('products')
                        .select('*', { count: 'exact', head: true })
                        .gt('end_time', new Date().toISOString())
                        .eq('category_id', catId);
    return count;
}

export async function countProsBySearch(searchValue) {
    const unaccent_search = await supabase.rpc('immutable_unaccent', { word: searchValue });
    const { count } = await supabase
                                .from('products')
                                .select('*', { count: 'exact', head: true })
                                .textSearch('fts', unaccent_search.data)
                                .gt('end_time', new Date().toISOString());
    return count;
}