import { Router } from "express";
import passport from "passport";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

router.get('', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/static', 'login.html'));
});

router.post("",
  passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: '/auth/failure',
  })
);

export default router;