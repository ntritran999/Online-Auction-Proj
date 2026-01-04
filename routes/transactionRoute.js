import { Router } from 'express';
import multer from "multer";
import fs from "fs";
import path from "path";
import { renderTransactionPage, sendMsg, cancelTranx, changeTranxStatus, createRating, createPayment, createShipment } from '../controllers/transactionController.js';

const router = Router();

router.get('/:id', renderTransactionPage);

router.post('/:id/message', sendMsg);

router.post('/:id/cancel', cancelTranx);

router.post('/:id/update', changeTranxStatus);

router.post('/:id/rating', createRating);

router.post('/:id/pay', createPayment);

router.post('/:id/ship', createShipment);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join('static', 'uploads');
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, 'static/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname + '-' + uniqueSuffix)
    }
});

const upload = multer({ storage: storage });

router.post('/:id/upload', upload.array('invoice'), (req, res) => {
    res.json({
        files: req.files
    });
});

export default router;