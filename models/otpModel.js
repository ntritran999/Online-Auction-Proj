import supabase from '../supabaseClient.js';

export async function addOtp(email, otp, expired_at) {
    const { error } = await supabase.from('otp_requests').insert({ email, otp, expired_at });
    return error;
}

export async function findUnexpiredOtp(email, otp) {
    const { data, error } = await supabase
                                .from('otp_requests')
                                .select('*')
                                .eq('email', email)
                                .eq('otp', otp)
                                .gt('expired_at', new Date().toISOString());
    
    return { data, error };
}

export async function deleteExpiredOtps() {
    const { data, error } = await supabase
                                .from('otp_requests')
                                .delete()
                                .lt('expires_at', new Date().toISOString());
    
    return { data, error };
}

export function deleteOtp(email, otp) {
    return supabase
        .from('otp_requests')
        .delete()
        .eq('email', email)
        .eq('otp', otp);
}