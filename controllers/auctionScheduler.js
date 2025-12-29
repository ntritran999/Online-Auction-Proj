import cron from 'node-cron';
import * as productModel from '../models/productModel.js';
import * as emailLogModel from '../models/emailLogModel.js';
import * as emailService from './emailService.js';
import * as bidderModel from '../models/bidderModel.js';

export function startAuctionScheduler() {
    console.log('Starting Auction Email Scheduler...');
    
    // Chạy mỗi phút
    cron.schedule('* * * * *', async () => {
        try {
            await checkEndedAuctions();
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    });

    console.log('Scheduler started - checking every minute');
}

async function checkEndedAuctions() {
    console.log('Checking for ended auctions...');
    const { data: endedProducts, error } = await productModel.getRecentlyEndedAuctions();

    if (error || !endedProducts || endedProducts.length === 0) {
        return;
    }

    console.log(`Found ${endedProducts.length} recently ended auction(s)`);

    for (const product of endedProducts) {
        console.log(`Processing product ${product.product_id}`);

        if (product.bid_count === 0 || !product.highest_bidder) {
            await emailService.sendAuctionEndedNoBidderEmail(product.product_id);
        } else {
            await emailService.sendAuctionEndedWithWinnerEmails(product.product_id);
            // add automatic transaction here
            await bidderModel.addTransactionAfterAuction(
                product.product_id,
                product.highest_bidder,
                product.seller_id,
            );
        }
        await emailLogModel.markAuctionEmailSent(product.product_id);
    }
}