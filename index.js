import express from "express";
import session from "express-session";
import passport from "passport";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { engine } from 'express-handlebars';
import "./auth.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 5000;

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

app.engine('handlebars', engine({
    helpers: {
        format_currency: function(num) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                currencyDisplay: 'symbol'
            }).format(num);
        },
        format_datetime: function(datetime) {
            return new Date().toLocaleString('vi-VN');
        },
        positive_percentage: function(plus, total) {
            if (total === 0)
                return 0;
            return Math.round((plus / total) * 100);
        },
        mask_name: function(name) {
            const show = name.substring(name.length - 3);
            return '*'.repeat(name.length - show.length) + show;
        },
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

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

import { loadCategoryList } from "./controllers/categoryController.js";
app.use(loadCategoryList)

app.get('/', (req, res) => {
    res.render('home');
});

import productRouter from './routes/productRoutes.js';
app.use('/product', productRouter);

import loginRouter from './routes/loginRoute.js';
app.use('/login', loginRouter);

import registerRouter from './routes/registerRoute.js';
app.use('/register', registerRouter);

import { createUser } from "./controllers/userController.js";
app.post("/verify-otp", createUser);

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

app.use((req, res) => {
    res.render('404');
})

app.listen(PORT, ()=> console.log(`http://localhost:${PORT}/`));
