import supabase from '../supabaseClient.js'

export async function findAllCatsWithSubCats() {
    const { data, error } = await supabase
                                .from('category')
                                .select(`category_id, category_name,
                                        subCats:category!parent_cat(
                                            category_id, category_name
                                        )`)
                                .is('parent_cat', null);
    return data;
}

export async function findCatById(id) {
    const { data, error } = await supabase.from('category').select().eq('category_id', id).single();
    if (error)
        return null;
    return data;
}

export async function findAllCats() {
    const { data, error } = await supabase.from('category').select('category_id, category_name');
    return data;
}
