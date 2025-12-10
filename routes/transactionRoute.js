import { Router } from 'express';
import { renderTransactionPage, sendMsg, cancelTranx, changeTranxStatus, createRating, createPayment } from '../controllers/transactionController.js';

const router = Router();

router.get('/:id', renderTransactionPage);

router.post('/:id/message', sendMsg);

router.post('/:id/cancel', cancelTranx);

router.post('/:id/update', changeTranxStatus);

router.post('/:id/rating', createRating);

router.post('/:id/pay', createPayment);

export default router;