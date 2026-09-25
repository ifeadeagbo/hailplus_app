const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const { validateOrderStatus, validateUUID } = require('../utils/validators');

router.use(authenticate, isAdmin); // All admin routes require authentication and admin role

router.get('/dashboard', adminController.getDashboard);
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', validateUUID('id'), validateOrderStatus, adminController.updateOrderStatus);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', validateUUID('id'), userController.updateUserRole);

module.exports = router;