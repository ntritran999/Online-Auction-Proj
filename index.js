import 'dotenv/config'
import express from "express";
import session from "express-session";
import passport from "passport";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { engine } from 'express-handlebars';
import express_handlebars_sections from 'express-handlebars-sections';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import updateLocale from "dayjs/plugin/updateLocale.js";
import utc from "dayjs/plugin/utc.js";
import "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 5000;

// login
function isLoggedIn(req, res, next) {
    console.log("IsLoggedIn check:", {
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        sessionID: req.sessionID
    });
    
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.status(401).send('Unauthorized - Please login');
}

function requireRole(role) {
    return (req, res, next) => {
        console.log("IsLoggedIn check:", {
            isAuthenticated: req.isAuthenticated(),
            hasUser: !!req.user,
            sessionID: req.sessionID
        });
        if (!req.isAuthenticated()) {
            return res.status(401).send("Unauthorized - Please login");
        }

        if (req.user.role !== role) {
            return res.status(403).send("Forbidden");
        }

        next();
    };
}

// dayjs config
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('en', {
    relativeTime: {
        future: "%s nữa",
        past: "%s trước",
        s: "vài giây",
        ss: "%d giây",
        m: "1 phút",
        mm: "%d phút",
        h: "1 giờ",
        hh: "%d giờ",
        d: "1 ngày",
        dd: "%d ngày",
        M: "1 tháng",
        MM: "%d tháng",
        y: "1 năm",
        yy: "%d năm",
    }
});
dayjs.extend(utc);

const app = express();
// system config
import { loadSystemConfig } from './controllers/adminController.js';
app.use(loadSystemConfig);
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    helpers: {
        format_currency: function(num) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                currencyDisplay: 'symbol'
            }).format(num);
        },
        format_datetime: function(datetime) {
            return new Date(datetime).toLocaleString('vi-VN');
        },
        format_endDatetime: function(endDatetime) {
            const now = dayjs();
            const end = dayjs(endDatetime);
            if (end.diff(now, 'd') < 0)
                return 'Phiên đấu giá đã kết thúc';
            else if (end.diff(now, 'd') < app.locals.relativeTimeDays)
                return end.from(now);
            return end.format('HH:mm:ss DD/MM/YYYY');
        },
        positive_percentage: function(plus, total) {
            if (total === 0)
                return 0;
            return Math.round((plus / total) * 100);
        },
        mask_name: function(name) {
            if (!name)
                return '';
            const show = name.substring(name.length - 3);
            return '*'.repeat(name.length - show.length) + show;
        },
        is_product_new: function(created_at) {
            const now = dayjs();
            const create = dayjs.utc(created_at).local();
            return now.diff(create, 'ms') < app.locals.highLightTime;
        },
        convert_to_local: function(created_at) {
            return dayjs.utc(created_at).local().toDate();
        },
        eq: function(a, b) {
            a = parseInt(a, 10);
            b = parseInt(b, 10);
            return a === b;
        },
        gt: function(a, b) {
            return a > b;
        },
        lt: function(a, b) {
            return a < b;
        },
        eqString: function(a ,b){
            return a == b;
        },
        or: function(a, b){
            return a || b;
        },
        not: function (value) {
            return !value;
        },
        inc: function(idx) {
            return parseInt(idx) + 1;
        },
        add: function(a, b) {
            return +a + +b;
        },
        format_QAtime: function(time) {
            const now = dayjs();
            const qaTime = dayjs(time);
            return qaTime.from(now);
        },
        section: express_handlebars_sections(),
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

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user; 
    next();
})

import renderHome from './controllers/homeController.js';
app.get('/', renderHome);

import productRouter from './routes/productRoutes.js';
app.use('/product', productRouter);

import loginRouter from './routes/loginRoute.js';
app.use('/login', loginRouter);

import registerRouter from './routes/registerRoute.js';
app.use('/register', registerRouter);

import { createUser } from "./controllers/userController.js";
app.post("/verify-otp", createUser);

import adminRouter from './routes/adminRoute.js';
app.use('/admin', requireRole('admin'), adminRouter);

import bidderRouter from './routes/bidderRoute.js';
app.use('/bidder', isLoggedIn, bidderRouter);
import accountRouter from './routes/accountRoute.js';
app.use('/account', isLoggedIn, accountRouter);

// google
app.get('/auth/google', 
    passport.authenticate('google', {scope: ['email', 'profile']})
);

app.get('/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/auth/failure',
    })
);

app.get('/auth/failure', (req, res) =>{
    res.send('failure');
});

app.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

import sellerRouter from "./routes/sellerRoute.js";
app.use('/', isLoggedIn, sellerRouter);

import txnRouter from './routes/transactionRoute.js';
app.use('/transaction', isLoggedIn, txnRouter);

app.use((req, res) => {
    res.render('404');
})

import { startAuctionScheduler } from './controllers/auctionScheduler.js';
startAuctionScheduler();

app.listen(PORT, ()=> console.log(`http://localhost:${PORT}/`));
