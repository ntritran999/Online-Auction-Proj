import supabase from "../supabaseClient.js";

export async function findBiddersByProId(proid) {
    const { data, error } = await supabase.rpc('get_bidders', {proid: proid});
    return data;
}

export async function addDeny(deny) {
    const bidQuery = await supabase
                        .from("bids")
                        .select()
                        .eq("product_id", deny.product_id)
                        .neq("bidder_id", deny.bidder_id)
                        .order("bid_amount", { ascending: false })
                        .limit(1);
    if (bidQuery.error) {
        console.log(bidQuery.error);
        return;
    }

    const productQuery = await supabase
                    .from("products")
                    .select()
                    .eq("product_id", deny.product_id)
                    .single();
    if (productQuery.error) {
        console.log(productQuery.error);
        return;
    }

    const {
        start_price,
        step_price,
        bid_count,
    } = productQuery.data;

    if (bidQuery.data.length === 0) {
        const productUpdate = await supabase
                            .from("products")
                            .update({
                                current_price: start_price,
                                highest_bidder: null,
                            })
                            .eq("product_id", deny.product_id);
        if (productUpdate.error) {
            console.log(productUpdate.error);
            return;
        }

        const autoBidUpdate = await supabase
                                    .from("autobids")
                                    .update({
                                        max_bid: start_price - step_price,
                                    })
                                    .eq("product_id", deny.product_id);
        if (autoBidUpdate.error) {
            console.log(autoBidUpdate.error);
            return;
        }
    }
    else {
        const {
            bidder_id: secondBidder,
            bid_amount,
        } = bidQuery.data[0];

        const productUpdate = await supabase
                            .from("products")
                            .update({
                                current_price: bid_amount,
                                highest_bidder: secondBidder,
                                bid_count: bid_count + 1,
                            })
                            .eq("product_id", deny.product_id);
        if (productUpdate.error) {
            console.log(productUpdate.error);
            return;
        }

        const autoBidUpdate = await supabase
                                    .from("autobids")
                                    .update({
                                        bidder_id: secondBidder,
                                        max_bid: bid_amount,
                                    })
                                    .eq("product_id", deny.product_id);
        if (autoBidUpdate.error) {
            console.log(autoBidUpdate.error);
            return;
        }

        const bidInsert = await supabase
                        .from("bids")
                        .insert({
                            product_id: deny.product_id,
                            bidder_id: secondBidder,
                            bid_amount: bid_amount
                        });
        if (bidInsert.error) {
            console.log(bidInsert.error);
            return;
        }
    }
    const { error } = await supabase.from('denied').insert(deny);
    if (error)
        console.log(error);
}