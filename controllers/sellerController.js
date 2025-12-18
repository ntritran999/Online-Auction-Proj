import path from "path";
import fs from "fs";
import * as catModel from "../models/categoryModel.js";
import * as proModel from "../models/productModel.js";
import * as sellerModel from "../models/sellerModel.js";

function toNumber(formatted_string) {
    return +(formatted_string.replace(/\./g, '').replace(/,/g, '.'));
}

const getCategories = async (req, res) => {
    const categories = await catModel.findAllCats();
    res.render('vwSeller/add', {
        list: categories,
    });
};

const uploadProduct = async (req, res) => {
    if (req.body.images) {
        const images = JSON.parse(req.body.images);
        images.forEach((img, idx) => {
            const oldPath = path.join('static', 'uploads', img);
            if (!fs.existsSync(oldPath)) {
                return res.redirect(`/${req.params.id}/add`);
            }
        });
    }
    
    const product = {
        seller_id: +req.params.id,
        category_id: +req.body.category_id,
        product_name: req.body.product_name,
        description: req.body.description,
        start_price: toNumber(req.body.start_price),
        step_price: toNumber(req.body.step_price),
        buy_now_price: toNumber(req.body.buy_now_price),
        current_price: toNumber(req.body.start_price),
        auto_extend: req.body.auto_extend == "on",
        bidder_rating_required: req.body.bidder_rating_required == "on",
        end_time: req.body.end_time
    };

    const { product_id: productId } = await proModel.addProduct(product);
    const imgDir = path.join('static', 'product_images', productId.toString());
    if (!fs.existsSync(imgDir)){
        fs.mkdirSync(imgDir, { recursive: true });
    }

    if(req.body.images) {
        const images = JSON.parse(req.body.images);
        images.forEach((img, idx) => {
            const oldPath = path.join('static', 'uploads', img);
            const fileName = `${idx}.jpg`;
            const newPath = path.join(imgDir, fileName);
            proModel.addImageUrl(productId, '/' + path.join('product_images', productId.toString(), fileName).replace(/\\/g, '/'));
            fs.renameSync(oldPath, newPath);
        });
    }

    const categories = await catModel.findAllCats();
    res.render('vwSeller/add', {
        list: categories,
    });
};

const updateDescription = async (req, res) => {
    await proModel.updateProDescription(req.params.id, req.body.description);
    res.render('vwSeller/update_description');
};

const denyBid = async (req, res) => {
    const deny = req.body;
    await sellerModel.addDeny(deny);
    res.redirect(req.headers.referer);
};

const isSeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.redirect('/');
    }
    next();
}

const isSameSeller = (req, res, next) => {
    const sellerId = req.params.id;
    if (parseInt(sellerId) !== req.user.user_id) {
        return res.redirect('/');
    }
    next();
}

const isProOwnedBySeller = async (req, res, next) => {
    const proId = req.params.id;
    if (!parseInt(proId)) {
        return res.redirect('/');
    }
    const check = await proModel.findProBySellerIdAndProId(req.user.user_id, proId);
    if (!check) {
        return res.redirect('/');
    }
    next();
}

export { getCategories, uploadProduct, updateDescription, denyBid, isSeller, isSameSeller, isProOwnedBySeller }
