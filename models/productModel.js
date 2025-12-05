import supabase from '../supabaseClient.js'

export async function findProById(id) {
    const { data, error } = await supabase
                        .from('products')
                        .select(`*,
                                image_list:productimages!product_id(
                                    image_url
                                )`)
                        .eq('product_id', id)
                        .single();
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
                                        ),
                                        image_list:productimages!product_id(
                                            image_url
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .order(column, { ascending: false })
                                .limit(numPros);
    return data;
}

export async function findLimitedProsByCatId(currentProId, catId, numPros) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        ),
                                        image_list:productimages!product_id(
                                            image_url
                                        )`)
                                .gt('end_time', new Date().toISOString())
                                .eq('category_id', catId)
                                .neq('product_id', currentProId)
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
                                        ),
                                        image_list:productimages!product_id(
                                            image_url
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
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        ),
                                        image_list:productimages!product_id(
                                            image_url
                                        )`)
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

export async function addProduct(product) {
    const { data, error } = await supabase.from('products').insert(product).select('product_id').single();
    return data;
}

export async function addImageUrl(proId, url) {
    const { error } = await supabase.from('productimages').insert({ product_id: proId, image_url: url })
    if (error) 
        console.log(error);
}

async function getProDescription(id) {
    const { data, error } = await supabase
                                .from('products')
                                .select('description')
                                .eq('product_id', id)
                                .single();
    return data;
}

export async function updateProDescription(id, content) {
    const { description } = await getProDescription(id);
    const newDescription = description + content;
    const { error } = await supabase.from('products').update({description: newDescription}).eq('product_id', id);
    if (error) 
        console.log(error);
}
