import { Router } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { sendOTP } from "../controllers/otp.js";
import { findUserByEmail } from "../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

const router = Router();

router.get('', (req, res) =>{
    res.sendFile(path.join(__dirname, '..', 'static', 'register.html'));
})

router.post('', async (req, res) => {
  const { email, ["g-recaptcha-response"]: token } = req.body;

  const emailCheck = await findUserByEmail(email);
  if (emailCheck) {
    return res.status(400).json({ error: "Email đã được sử dụng" });
  }

  if(!token)
    return res.status(400).json({ error: "Missing reCAPTCHA token" });

  try{
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`;
    const result = await fetch(verifyUrl, { method: "POST" });
    const verifyData = await result.json();

    if(!verifyData.success)
      return res.status(403).json({ error: "reCAPTCHA verification failed" });

    await sendOTP(email); // Gửi OTP đến email
    res.json({ message: "OTP đã được gửi đến email của bạn. Vui lòng nhập mã OTP để hoàn tất đăng ký." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;