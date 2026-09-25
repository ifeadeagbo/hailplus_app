const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const {
  validateAddToCart,
  validateUpdateCart,
  validateCartQuote,
  validateCartMerge,
  validateUUID
} = require('../utils/validators');

// Guests keep their cart in the browser; this prices it
router.post('/quote', validateCartQuote, cartController.quoteCart);

router.use(authenticate); // All other cart routes require authentication

router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.get('/validate', cartController.validateCart);
router.post('/', validateAddToCart, cartController.addToCart);
router.post('/merge', validateCartMerge, cartController.mergeCarts);
router.post('/discount', cartController.applyDiscount);
router.put('/:id', validateUpdateCart, cartController.updateCartItem);
router.delete('/:id', validateUUID('id'), cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
