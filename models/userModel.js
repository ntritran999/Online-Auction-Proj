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

export async function addPlusRating(user_id, value) {
    const user = await findUserById(user_id);
    const { error } = await supabase
                            .from('users')
                            .update({
                                'rating_plus': user.rating_plus + value
                            })
                            .eq('user_id', user_id);
    if (error) {
        console.log(error);
    }
}

export async function addMinusRating(user_id, value) {
    const user = await findUserById(user_id);
    const { error } = await supabase
                            .from('users')
                            .update({
                                'rating_minus': user.rating_minus + value
                            })
                            .eq('user_id', user_id);
    if (error) {
        console.log(error);
    }
}