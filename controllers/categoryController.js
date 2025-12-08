import * as category from '../models/categoryModel.js';

const loadCategoryList = async (req, res, next) => {
    const parentList = await category.findAllCatsWithSubCats();
    res.locals.parentList = parentList;
    next();
};

export { loadCategoryList };