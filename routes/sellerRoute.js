import { Router } from "express";
import multer from "multer";

import { denyBid, getCategories, updateDescription, uploadProduct } from "../controllers/sellerController.js";

const router = Router();

router.get('/:id/add', getCategories);

router.post('/:id/add', uploadProduct);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname + '-' + uniqueSuffix)
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.array('images'), (req, res) => {
    res.json({
        files: req.files
    });
});

router.get('/:id/update_description', (req, res) => {
    res.render('vwSeller/update_description');
});

router.post('/:id/update_description', updateDescription);

router.post('/denyBid', denyBid);

export default router;