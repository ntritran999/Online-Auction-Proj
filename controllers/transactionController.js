import * as transactModel from '../models/transactionModel.js';
import * as usrModel from '../models/userModel.js';

const renderTransactionPage = async (req, res) => {
    if (isNaN(parseInt(req.params.id))) {
        return res.redirect('/');
    }

    const txn = await transactModel.findTransactionByPro(req.params.id);
    if (!txn) {
        return res.redirect('/');
    }

    const messages = await transactModel.findMessagesByTranx(txn.transaction_id);
    const isSeller = req.user.user_id === parseInt(txn.seller_id);
    res.render('vwProducts/product_complete', {
        transaction: txn,
        is_seller: isSeller,
        messages: messages,
    })
};

const sendMsg = async (req, res) => {
    const msg = {
        transaction_id: +req.body.txn_id,
        message_text: req.body.msg,
        sender_id: req.body.sender,
    };
    await transactModel.createMsg(msg);
    
    res.redirect(`/transaction/${req.params.id}`);
};

const cancelTranx = async (req, res) => {
    const txnId = req.body.txnId;
    await transactModel.updateCancelTxn(txnId);
    await usrModel.addMinusRating(req.body.receiver, 1);
    await transactModel.addRating({
        rater_id: req.body.sender,
        target_id: req.body.receiver,
        product_id: +req.params.id,
        rating_value: -1,
        comment: 'Người thắng không thanh toán',
    });
    res.redirect(`/transaction/${req.params.id}`);
};

const changeTranxStatus = async (req, res) => {
    await transactModel.updateTxnStatus(+req.body.txnId, req.body.status);
    res.redirect(`/transaction/${req.params.id}`);
};

const createRating = async (req, res) => {
    const rater_id = req.body.sender;
    const target_id = req.body.receiver;
    const product_id = +req.params.id;
    const rating_value = +req.body.rating;
    const comment = req.body.comment;

    const rating = await transactModel.findRating(product_id, rater_id, target_id);
    if (rating) {
        await transactModel.updateRating(rating.rating_id, rating_value, comment);
    }
    else {
        await transactModel.addRating({
            rater_id: rater_id,
            target_id: target_id,
            product_id: product_id,
            rating_value: rating_value,
            comment: comment,
        });
    }

    const is_positive = (rating_value === 1) ? true : false;
    let rating_plus_value = 0;
    let rating_minus_value = 0;
    if (rating) {
        if (rating.rating_value !== rating_value) {
            if (is_positive) {
                rating_plus_value = 1;
                rating_minus_value = -1;
            }
            else {
                rating_plus_value = -1;
                rating_minus_value = 1;
            }
        }
    }
    else {
        if (is_positive) {
            rating_plus_value = 1;
        }
        else {
            rating_minus_value = 1;
        }
    }
    await usrModel.addPlusRating(target_id, rating_plus_value);
    await usrModel.addMinusRating(target_id, rating_minus_value);

    res.redirect(`/transaction/${req.params.id}`);
};

const createPayment = async (req, res) => {
    const txnId = +req.body.txnId;
    const invoice = `/invoices/invoice_${txnId}.pdf`;
    const address = req.body.address;
    await transactModel.updateTxnPaymentInfo(txnId, address, invoice);
    res.redirect(`/transaction/${req.params.id}`);
}

export { renderTransactionPage, sendMsg, cancelTranx, changeTranxStatus, createRating, createPayment }