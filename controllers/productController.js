import { matchedData, validationResult } from 'express-validator';
import * as categoryModel from '../models/categoryModel.js';
import * as productModel from '../models/productModel.js';
import * as userModel from '../models/userModel.js';
import * as bidModel from '../models/sellerModel.js';

const numPros = 4;

function getPageNums(page_counts) {
    return Array.from({length: page_counts}, (_, i) => {
        return {'value': i + 1};
    });
}

function getImageSlides(img_list) {
    const slide_size = 5;
    let image_slides = [];
    for (let i = 0; i < img_list.length; i += slide_size) {
        const slide = img_list.slice(i, i + slide_size);
        image_slides.push(slide);
    }
    return image_slides;
}

const getProByCat = async (req, res) => {
    const id = req.params.id;
    const cat = await categoryModel.findCatById(id);
    if (!cat) {
        return res.redirect('/');
    }
    
    const result = validationResult(req);
    if (!result.isEmpty()) {
        console.log(result.array());
        return res.render('vwProducts/product_notfound');
    }

    const data = matchedData(req);
    const page = data.page || 1;
    const offset = (page - 1) * numPros;

    const total = await productModel.countProsByCatId(id);
    const page_counts = Math.ceil(total / numPros);

    if (page_counts && page > page_counts) {
        return res.render('vwProducts/product_notfound');
    }

    const list = await productModel.findPageByCatId(id, numPros, offset);
    const product_category = {
        'cat_name' : cat.category_name,
        'products' : list,
        'cur_page': page,
        'prev_page': +page - 1,
        'next_page': +page + 1,
        'page_counts': page_counts,
        'page_nums': getPageNums(page_counts),
    };
    res.render('vwProducts/product', product_category);
};

const getProDetails = async (req, res) => {
    const id = req.params.id;
    const product = await productModel.findProById(id);
    if (!product) {
        return res.redirect('/');
    }

    const seller = await userModel.findUserById(product.seller_id);
    seller.total_rating = seller.rating_plus + seller.rating_minus;
    const top_bidder = await userModel.findUserById(product.highest_bidder);
    if (top_bidder)
        top_bidder.total_rating = top_bidder.rating_plus + top_bidder.rating_minus;

    const numPros = 5;
    const list = await productModel.findLimitedProsByCatId(id, product.category_id, numPros);

    // admin function
    const fromAdmin = req.query.from === 'admin';
    const adminProPage = req.query.proPage || 1;
    
    const isSeller = (req.user) ? req.user.user_id == seller.user_id : 0;
    const bidder_list = await bidModel.findBiddersByProId(id);

    const qa_list = await productModel.getQAHistory(id);

    const pro_details = {
        'product' : product,
        'main_image': product.image_list[0],
        'slides': getImageSlides(product.image_list.slice(1)),
        'seller' : seller,
        'top_bidder' : top_bidder,
        'related': list,
        'fromAdmin': fromAdmin, // admin function
        'adminProPage': adminProPage,
        'isSeller': isSeller,
        'bidders': bidder_list,
        'qa_list': qa_list,
    };
    res.render('vwProducts/product_detail', pro_details);
};

const getProsBySearch = async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        console.log(result.array());
        return res.render('vwProducts/product_notfound');
    }

    const data = matchedData(req);
    const page = data.page || 1;
    const offset = (page - 1) * numPros;

    let searchValue = data.item;
    searchValue = searchValue.trim().replace(/\s/g, " & ").toLowerCase();

    const total = await productModel.countProsBySearch(searchValue);
    const page_counts = Math.ceil(total / numPros);

    if (page_counts && page > page_counts) {
        return res.render('vwProducts/product_notfound');
    }
    
    const list = await productModel.findPageBySearch(searchValue, numPros, offset);
    const product_category = {
        'cat_name' : 'Kết quả tìm kiếm',
        'products' : list,
        'cur_page': page,
        'prev_page': +page - 1,
        'next_page': +page + 1,
        'page_counts': page_counts,
        'page_nums': getPageNums(page_counts),
        'item': data.item,
    };
    res.render('vwProducts/product', product_category);
};

const createQuestion = async (req, res) => {
    const question = {
        product_id: req.body.product_id,
        user_id: req.user.user_id,
        question_text: req.body.question_text
    };

    await productModel.addQuestion(question);

    res.redirect(req.headers.referer);
}

const createAnswer = async (req, res) => {
    const answer = {
        question_id: req.body.question_id,
        seller_id: req.user.user_id,
        answer_text: req.body.answer_text
    };

    await productModel.addAnswer(answer);

    res.redirect(req.headers.referer);
}

export { getProByCat, getProDetails, getProsBySearch, createQuestion, createAnswer }