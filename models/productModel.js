import supabase from '../supabaseClient.js'
import dayjs from 'dayjs';

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

export async function findTopProsByColumn(column, numPros, isAsc) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`*,
                                        highest_bidder:users!highest_bidder(
                                            full_name
                                        ),
                                        image_list:productimages!product_id(
                                            image_url
                                        )`)
                                .gt('end_time', dayjs().format())
                                .order(column, { ascending: isAsc, nullsFirst: false })
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
                                .gt('end_time', dayjs().format())
                                .eq('category_id', catId)
                                .neq('product_id', currentProId);

    const { data: subdata, error: suberr } = await supabase
                                                .from('products')
                                                .select(`*,
                                                        highest_bidder:users!highest_bidder(
                                                            full_name
                                                        ),
                                                        image_list:productimages!product_id(
                                                            image_url
                                                        ),
                                                        category!inner(
                                                            parent_cat
                                                        )`)
                                                .gt('end_time', dayjs().format())
                                                .eq('category.parent_cat', catId)
                                                .neq('product_id', currentProId);
    let result = data.concat(subdata);
    result.sort((a, b) => (new Date(b.created_at)) - (new Date(a.created_at)));
    return result.slice(0, numPros);
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
                                .gt('end_time', dayjs().format())
                                .eq('category_id', catId);

    const { data: subdata, error: suberr } = await supabase
                                                .from('products')
                                                .select(`*,
                                                        highest_bidder:users!highest_bidder(
                                                            full_name
                                                        ),
                                                        image_list:productimages!product_id(
                                                            image_url
                                                        ),
                                                        category!inner(
                                                            parent_cat
                                                        )`)
                                                .gt('end_time', dayjs().format())
                                                .eq('category.parent_cat', catId);
    let result = data.concat(subdata);
    result.sort((a, b) => (new Date(b.created_at)) - (new Date(a.created_at)));
    return result.slice(offset, offset + numPros);
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
                                .gt('end_time', dayjs().format())
                                .range(offset, offset + numPros - 1)
                                .order('created_at', { ascending: false });
    return data;
}

export async function countProsByCatId(catId) {
    const { count } = await supabase
                        .from('products')
                        .select('*', { count: 'exact', head: true })
                        .gt('end_time', dayjs().format())
                        .eq('category_id', catId);
    return count;
}

export async function countProsBySearch(searchValue) {
    const unaccent_search = await supabase.rpc('immutable_unaccent', { word: searchValue });
    const { count } = await supabase
                                .from('products')
                                .select('*', { count: 'exact', head: true })
                                .textSearch('fts', unaccent_search.data)
                                .gt('end_time', dayjs().format());
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

export async function addQuestion(question) {
    const { error } = await supabase.from('questions').insert(question);
    if (error)
        console.log(error);
}

export async function addAnswer(answer) {
    const { error } = await supabase.from('answers').insert(answer);
    if (error)
        console.log(error);
}

export async function getQAHistory(pro_id) {
    const { data, error } = await supabase
                                .from('questions')
                                .select(`question_id, user_id, question_text, created_at,
                                    answer: answers!question_id(
                                        answer_text, created_at,
                                        seller: users!user_id(
                                            full_name
                                        )
                                    ),
                                    bidder: users!user_id(
                                        full_name
                                    )`)
                                .eq('product_id', pro_id);
    return data;
}

export async function findProBySellerIdAndProId(sellerId, proId) {
    const { data, error } = await supabase
                                .from('products')
                                .select()
                                .eq('seller_id', sellerId)
                                .eq('product_id', proId)
                                .single();
    return data;
}

export async function findProsBySeller(sellerId) {
    const { data, error } = await supabase
                                .from('products')
                                .select('product_id, product_name')
                                .eq('seller_id', sellerId)
                                .gt('end_time', dayjs().format());
    return data;
}

export async function findProsWithTxnBySeller(seller) {
    const { data, error } = await supabase
                                .from('products')
                                .select(`product_id, product_name,
                                    transactions!inner (
                                        transaction_id
                                    )
                                    `)
                                .eq('seller_id', seller)
                                .not('transactions.transaction_id', 'is', null);
    return data;
}

export async function checkDenial(userId, productId) {
    const { data, error } = await supabase
                                .from("denied")
                                .select()
                                .eq("bidder_id", userId)
                                .eq("product_id", productId)
                                .single();
    return data;
}
