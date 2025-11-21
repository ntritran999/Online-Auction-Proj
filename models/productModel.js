import supabase from '../supabaseClient.js'

export async function findAllByCatId(catId) {
    const { data, error } = await supabase.from('products').select().eq('category_id', catId);
    return data;
}

export async function findProById(id) {
    const { data, error } = await supabase.from('products').select().eq('product_id', id).single();
    if (error)
        return null;
    return data;
}