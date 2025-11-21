import { Router } from 'express';
import * as categoryModel from '../models/categoryModel.js';
import * as productModel from '../models/productModel.js';
import * as userModel from '../models/userModel.js';

const router = Router();

router.get('/cat/:id', async (req, res) => {
    const id = req.params.id;
    const cat = await categoryModel.findCatById(id);
    if (!cat) {
        res.redirect('/');
        return;
    }
    
    const list = await productModel.findAllByCatId(cat.category_id);
    for(let i = 0; i < list.length; i++) {
        const top_bidder = await userModel.findUserById(list[i].highest_bidder) || '';
        list[i].highest_bidder = top_bidder;
    }

    const product_category = {
        'cat_name' : cat.category_name,
        'products' : list,
    };
    res.render('vwProducts/product.handlebars', product_category);
})

router.get('/details/:id', async (req, res) => {
    const id = req.params.id;
    const product = await productModel.findProById(id);
    if (!product) {
        res.redirect('/');
        return;
    }

    const seller = await userModel.findUserById(product.seller_id);
    seller.total_rating = seller.rating_plus + seller.rating_minus;
    const top_bidder = await userModel.findUserById(product.highest_bidder);
    if (top_bidder)
        top_bidder.total_rating = top_bidder.rating_plus + top_bidder.rating_minus;
    const pro_details = {
        'product' : product,
        'seller' : seller,
        'top_bidder' : top_bidder,
    };
    res.render('vwProducts/product_detail.handlebars', pro_details);
})

export default router;