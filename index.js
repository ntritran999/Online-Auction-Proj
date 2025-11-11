// import supabase from "./supabaseClient.js";
// const session = require("express-session");
// const express = require('express');
// const passport = require('passport');
// const path = require('path');
// require('dotenv').config();
// require('./auth');

import bcrypt from "bcrypt";
import express from "express";
import session from "express-session";
import passport from "passport";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import supabase from "./supabaseClient.js";
import "./auth.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const adminGmail = process.env.EMAIL_USER;
const adminGmailPass = process.env.EMAIL_PASS;

// OTP function
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: adminGmail,
    pass: adminGmailPass,
  }
});
const generateOTP = () =>{
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTP = async(email) => {
  const otp = generateOTP();
  const expiredAt = new Date(Date.now() + 2 * 60 * 1000);
  // insert otp into db
  const { error } = await supabase
    .from('otp_requests')
    .insert([{ email, otp, expired_at: expiredAt}]);
  if(error){
    console.log('Error insert otp db', error);
    return;
  }

  const mailOptions = {
    from: adminGmail,
    to: email,
    subject: 'Your OTP code',
    text: `Your OTP code is ${otp}`,
  };
  transporter.sendMail(mailOptions, (error, info) =>{
    if(error){
      console.log('Error send email', error);
      return;
    }
    console.log('OTP sent');
  });
};

const verifyOTP = async (email, otp) => {
  const { data, error } = await supabase
    .from('otp_requests')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .gt('expired_at', new Date().toISOString());

  if(!data || data.length === 0){
    console.log('OTP invalid or expired.');
    return false;
  }

  if(error){
    console.error('Error verifying OTP:', error.message);
    return false;
  }
  return true;
}

// Hàm xóa OTP hết hạn
const cleanExpiredOTPs = async () => {
  const { data, error } = await supabase
      .from('otp_requests')
      .delete()
      .lt('expires_at', new Date().toISOString());

  if(error) 
      console.error('Error deleting expired OTPs:', error);
  else 
      console.log('Expired OTPs deleted:', data);
  
};

// login
function isLoggedIn(req, res, next) {
    console.log("👉 isLoggedIn check:", {
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        sessionID: req.sessionID
    });
    
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.status(401).send('Unauthorized - Please login');
}

const app = express();
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
  secret: "cats", 
  resave: false,              
  saveUninitialized: false,  
  cookie: {                  
    secure: false,           
    httpOnly: true,
    maxAge: 1000 * 60 * 60    // 1 giờ
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) =>{
    res.sendFile(path.join(__dirname, 'register.html'));
})

app.post("/register", async (req, res) => {
  const { full_name, email, address, password, ["g-recaptcha-response"]: token } = req.body;

  if(!token)
    return res.status(400).json({ error: "Missing reCAPTCHA token" });

  try{
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`;
    const result = await fetch(verifyUrl, { method: "POST" });
    const verifyData = await result.json();

    if(!verifyData.success)
      return res.status(403).json({ error: "reCAPTCHA verification failed" });

    const otp = generateOTP();
    // console.log(adminGmail);
    // console.log(adminGmailPass);
    // console.log(email);
    await sendOTP(email, otp); // Gửi OTP đến email

    // Lưu otp
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút
    await supabase
        .from('otp_requests')
        .insert([{ email, otp, expires_at: expiresAt }]);
    res.json({ message: "OTP đã được gửi đến email của bạn. Vui lòng nhập mã OTP để hoàn tất đăng ký." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp, password, full_name, address } = req.body;
    console.log(email);
    console.log(otp);
    try {
        const isValid = await verifyOTP(email, otp); 

        if (!isValid) {
            return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn." });
        }

        const hash = await bcrypt.hash(password, 10);
        // add into db
        const { data, error } = await supabase
            .from("users")
            .insert([{ full_name, email, address, password_hash: hash }])
            .select()
            .single();

        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }

        // Xóa OTP đã sử dụng
        await supabase
            .from('otp_requests')
            .delete()
            .eq('email', email)
            .eq('otp', otp);

        res.json({ message: "Đăng ký thành công!", user: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/login",
  passport.authenticate("local", {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
  })
);


// google
app.get('/auth/google', 
    passport.authenticate('google', {scope: ['email', 'profile']})
);

app.get('/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/protected',
        failureRedirect: '/auth/failure',
    })
);

app.get('/auth/failure', (req, res) =>{
    res.send('failure');
});

app.get('/protected', isLoggedIn, (req, res) =>{
    res.send(`Hello ${req.user.email}`);
});

app.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.send("Goodbye!");
    });
  });
});


app.listen(5000, ()=> console.log('http://localhost:5000/'));
