import express from 'express';
import { engine } from 'express-handlebars';

const app = express();
const PORT = process.env.PORT || 3000;

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
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/static', express.static('static'));
app.use(express.urlencoded());

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/product', (req, res) => {
    res.render('product');
});

app.get('/product_detail', (req, res) => {
    res.render('product_detail');
});

app.listen(PORT, () => {
    console.log(`Listening at localhost:${PORT}`);
});
