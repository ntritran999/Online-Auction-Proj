import * as category from '../models/categoryModel.js';

const loadCategoryList = async (req, res, next) => {
    const parentList = await category.findAllParentCats();
    for (let i = 0; i < parentList.length; i++) {
        const subList = await category.findSubCatsOf(parentList[i].category_id);
        parentList[i].subCats = subList;
    }
    res.locals.parentList = parentList;

    next();
};

export { loadCategoryList };