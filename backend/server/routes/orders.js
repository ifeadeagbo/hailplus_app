const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { validateOrder, validateUUID } = require('../utils/validators');

router.use(authenticate); // All order routes require authentication

router.post('/', orderLimiter, validateOrder, orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', validateUUID('id'), orderController.getOrderById);
router.post('/:id/confirm-payment', validateUUID('id'), orderController.confirmPayment);
router.post('/:id/cancel', validateUUID('id'), orderController.cancelOrder);

module.exports = router;
