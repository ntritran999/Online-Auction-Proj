import supabase from '../supabaseClient.js';

// category
export async function findAllCategories() {
    const { data, error } = await supabase
        .from('category')
        .select('category_id, category_name, parent_cat')
        .order('category_id');
    return { data, error };
}

export async function findCategoriesPaginated(limit = 10, offset = 0) {
    const { data, error } = await supabase
        .from('category')
        .select('category_id, category_name, parent_cat')
        .order('category_id')
        .range(offset, offset + limit - 1);
    return { data, error };
}

export async function countCategories() {
    const { count, error } = await supabase
        .from('category')
        .select('*', { count: 'exact', head: true });
    return { count, error };
}

export async function findCategoryById(id) {
    const { data, error } = await supabase
        .from('category')
        .select()
        .eq('category_id', id)
        .single();
    return { data, error };
}

export async function createCategory(category_name, parent_cat = null) {
    const { data, error } = await supabase
        .from('category')
        .insert({ category_name, parent_cat })
        .select()
        .single();
    return { data, error };
}

export async function updateCategory(category_id, category_name, parent_cat = null) {
    const { data, error } = await supabase
        .from('category')
        .update({ category_name, parent_cat })
        .eq('category_id', category_id)
        .select()
        .single();
    return { data, error };
}

export async function deleteCategory(category_id) {
    // Check if category has products
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category_id);
    
    if (count > 0) {
        return { data: null, error: { message: 'Cannot delete category with existing products' } };
    }
    
    const { data, error } = await supabase
        .from('category')
        .delete()
        .eq('category_id', category_id)
        .select()
        .single();
    return { data, error };
}

export async function countProductsByCategory(category_id) {
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category_id);
    return { count, error };
}

// product
export async function findAllProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            seller:users!seller_id(full_name, email),
            category:category(category_name)
        `)
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function findProductsPaginated(limit = 10, offset = 0) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            seller:users!seller_id(full_name, email),
            category:category(category_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    return { data, error };
}

export async function countProducts() {
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    return { count, error };
}

export async function findProductById(id) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            seller:users!seller_id(full_name, email),
            category:category(category_name)
        `)
        .eq('product_id', id)
        .single();
    return { data, error };
}

export async function removeProduct(product_id) {
    const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', product_id)
        .select()
        .single();
    return { data, error };
}

// user
export async function findAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, email, role, rating_plus, rating_minus, created_at, address')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function findUsersPaginated(limit = 10, offset = 0) {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, email, role, rating_plus, rating_minus, created_at, address')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    return { data, error };
}

export async function countUsers() {
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
    return { count, error };
}

export async function createUserByAdmin(full_name, email, password_hash, role = 'bidder', address = null) {
    const { data, error } = await supabase
        .from('users')
        .insert({ full_name, email, password_hash, role, address })
        .select()
        .single();
    return { data, error };
}

export async function updateUser(user_id, updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user_id)
        .select()
        .single();
    return { data, error };
}

export async function deleteUser(user_id) {
    const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user_id)
        .select()
        .single();
    return { data, error };
}

// request
export async function findAllUpgradeRequests() {
    const { data, error } = await supabase
        .from('upgrade_requests')
        .select(`
            request_id,
            user_id,
            note,
            status,
            created_at,
            user:users(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function approveUpgradeRequest(request_id, user_id) {
    // Update user role to seller
    const { error: userError } = await supabase
        .from('users')
        .update({ role: 'seller' })
        .eq('user_id', user_id);
    
    if (userError) return { data: null, error: userError };
    
    // Update request status
    const { data, error } = await supabase
        .from('upgrade_requests')
        .update({ status: 'approved' })
        .eq('request_id', request_id)
        .select()
        .single();
    
    return { data, error };
}

export async function rejectUpgradeRequest(request_id) {
    const { data, error } = await supabase
        .from('upgrade_requests')
        .update({ status: 'rejected' })
        .eq('request_id', request_id)
        .select()
        .single();
    return { data, error };
}

// system
export async function getSystemConfig() {
    const { data, error } = await supabase
        .from('systemconfig')
        .select('key, value');
    return { data, error };
}

export async function updateSystemConfig(key, value) {
    const { data, error } = await supabase
        .from('systemconfig')
        .update({ value })
        .eq('key', key)  
        .select()
        .single();
    return { data, error };
}