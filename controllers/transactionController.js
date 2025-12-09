import * as transactModel from '../models/transactionModel.js';

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
}

export { renderTransactionPage, sendMsg }