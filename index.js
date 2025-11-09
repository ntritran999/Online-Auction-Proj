// 5.1 Đăng nhập
// Tự cài đặt
// Hoặc sử dụng passportjs (http://www.passportjs.org)
// Khuyến khích cài đặt thêm chức năng đăng nhập qua Google, Facebook, Twitter, Github, …


// 1.6 Đăng ký
// Người dùng cần đăng ký tài khoản để có thể đặt giá (bid)
// reCaptcha
// Mật khẩu được mã hoá bằng thuật toán bcrypt hoặc scrypt
// Thông tin
// Họ tên
// Địa chỉ
// Email
// Email không được trùng
// Có xác nhận OTP
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

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

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

    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert([{ full_name, email, address, password_hash: hash }])
      .select()
      .single();

    if(error){
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
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
