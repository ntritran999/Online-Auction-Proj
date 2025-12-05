import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as catModel from "../models/categoryModel.js";
import * as proModel from "../models/productModel.js";

const router = Router();

router.get('/:id/add', async (req, res) => {
    const categories = await catModel.findAllCats();
    res.render('vwSeller/add', {
        list: categories,
    });
});

function toNumber(formatted_string) {
    return +(formatted_string.replace(/\./g, '').replace(/,/g, '.'));
}

router.post('/:id/add', async (req, res) => {
    const product = {
        seller_id: +req.params.id,
        category_id: +req.body.category_id,
        product_name: req.body.product_name,
        description: req.body.description,
        start_price: toNumber(req.body.start_price),
        step_price: toNumber(req.body.step_price),
        buy_now_price: toNumber(req.body.buy_now_price),
        auto_extend: req.body.auto_extend == "on",
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
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage });

router.post('/upload', upload.array('images'), (req, res) => {
    res.json({
        files: req.files
    });
})


router.get('/:id/update_description', (req, res) => {
    res.render('vwSeller/update_description');
});

router.post('/:id/update_description', async (req, res) => {
    await proModel.updateProDescription(req.params.id, req.body.description);
    res.render('vwSeller/update_description');
})

export default router;