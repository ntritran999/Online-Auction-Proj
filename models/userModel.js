import supabase from '../supabaseClient.js';

export async function findUserById(id) {
    const { data, error } = await supabase.from('users').select().eq('user_id', id).single();
    if (error) 
        return null;
    return data;
}

export async function addUser(full_name, email, address, password_hash) {
    const { data, error } = await supabase
                                .from("users")
                                .insert({ full_name, email, address, password_hash })
                                .select()
                                .single();
    return { data, error };
}