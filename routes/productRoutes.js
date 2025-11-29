import { Router } from 'express';
import { query } from 'express-validator';

import { getProByCat, getProDetails, getProsBySearch } from '../controllers/productController.js';

const router = Router();

router.get('/cat/:id', query('page').optional().isNumeric(), getProByCat)

router.get('/details/:id', getProDetails)

router.get('/results', query('item').notEmpty().escape(), query('page').optional().isNumeric(), getProsBySearch)

export default router;