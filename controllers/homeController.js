import { findTopProsByColumn } from "../models/productModel.js";

export default async function renderHome(req, res) {
    const numTopPros = 5;
    const dateList = await findTopProsByColumn('end_time',numTopPros);
    const bidCountsList = await findTopProsByColumn('bid_count', numTopPros);
    const priceList = await findTopProsByColumn('current_price', numTopPros);
    const list = {
        'dateList': dateList,
        'bidCountsList': bidCountsList,
        'priceList': priceList
    }
    res.render('home', list);
};