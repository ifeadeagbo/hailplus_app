const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate); // All order routes require authentication

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;