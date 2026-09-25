const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const {
  validateProduct,
  validateProductUpdate,
  validatePagination,
  validateUUID
} = require('../utils/validators');

// Public routes
router.get('/', validatePagination, productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', validateUUID('id'), productController.getProductById);

// Admin routes
router.post('/', authenticate, isAdmin, validateProduct, productController.createProduct);
router.put('/:id', authenticate, isAdmin, validateUUID('id'), validateProductUpdate, productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, validateUUID('id'), productController.deleteProduct);

module.exports = router;
