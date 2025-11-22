import supabase from '../supabaseClient.js'

export async function findAllParentCats() {
    const { data, error } = await supabase.from('category').select('category_id, category_name').is('parent_cat', null);
    return data;
}

export async function findSubCatsOf(parentId) {
    const { data, error } = await supabase.from('category').select().eq('parent_cat', parentId);
    return data;
}

export async function findCatById(id) {
    const { data, error } = await supabase.from('category').select().eq('category_id', id).single();
    if (error)
        return null;
    return data;
}