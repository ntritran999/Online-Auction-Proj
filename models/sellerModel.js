import supabase from "../supabaseClient.js";

export async function findBiddersByProId(proid) {
    const { data, error } = await supabase.rpc('get_bidders', {proid: proid});
    return data;
}

export async function addDeny(deny) {
    const { error } = await supabase.from('denied').insert(deny);
    if (error)
        console.log(error);
}