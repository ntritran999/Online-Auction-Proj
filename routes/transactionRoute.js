import { Router } from 'express';
import { renderTransactionPage, sendMsg } from '../controllers/transactionController.js';

const router = Router();

router.get('/:id', renderTransactionPage);

router.post('/:id/message', sendMsg);

export default router;