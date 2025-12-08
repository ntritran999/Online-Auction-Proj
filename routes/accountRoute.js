import { Router } from "express";

const router = Router();

router.get('/profile', (req, res) => {
    res.render('vwProfile/edit', { 
        layout: 'profile', 
    });
})

export default router;