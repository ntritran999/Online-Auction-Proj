import { Router } from "express";
import * as proModel from '../models/productModel.js';

const router = Router();

router.get('/profile', (req, res) => {
    res.render('vwProfile/edit', { 
        layout: 'profile', 
    });
})

router.get('/selling', async (req, res) => {
    const list = await proModel.findProsBySeller(req.user.user_id);
    res.render('vwProfile/selling_products', {
        layout: 'profile',
        products: list,
    })
})

export default router;