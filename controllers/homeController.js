import { findTopProsByColumn } from "../models/productModel.js";

export default async function renderHome(req, res) {
    const numTopPros = 5;
    const columns = ['end_time', 'bid_count', 'current_price'];
    const titles = [
        'Sản phẩm sắp kết thúc',
        'Sản phẩm nhiều lượt ra giá nhất',
        'Sản phẩm giá cao nhất',
    ];

    let list = [];
    for (let i = 0; i < columns.length; i++) {
        const products = await findTopProsByColumn(columns[i], numTopPros); 
        list.push({
            title: titles[i],
            products: products,
        });
    }
    res.render('home', {
        list: list,
    });
};