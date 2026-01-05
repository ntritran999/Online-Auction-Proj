import { Router } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import * as adminController from "../controllers/adminController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

router.get('/', adminController.renderAdminDashboard);
// category
router.post('/categories', adminController.addCategory);
router.post('/categories/:id', adminController.editCategory);
router.post('/categories/:id/delete', adminController.removeCategory);

// product
router.post('/products/:id/delete', adminController.deleteProduct);

// user
router.post('/users', adminController.addUser);
router.post('/users/:id', adminController.editUser);
router.post('/users/:id/delete', adminController.removeUser);

//request
router.post('/upgrade-requests/:id/approve', adminController.approveUpgrade);
router.post('/upgrade-requests/:id/reject', adminController.rejectUpgrade);

// config(time highlight, relativeTimeDays, extendBoundary, extendTime) function
router.get('/others', adminController.renderAdminConfig);
router.post('/others', adminController.updateAdminConfig);

router.post('/users/:id/reset-password', adminController.resetUserPassword);
export default router;