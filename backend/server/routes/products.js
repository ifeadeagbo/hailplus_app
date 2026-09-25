const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', authenticate, isAdmin, productController.createProduct);
router.put('/:id', authenticate, isAdmin, productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

module.exports = router;