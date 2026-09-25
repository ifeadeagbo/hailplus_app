const { body, param, query, validationResult } = require('express-validator');

// Common validation chains
// Lowercased but otherwise kept as typed (normalizeEmail strips dots from
// Gmail addresses, which then no longer match the address Google returns)
const validateEmail = body('email')
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage('Please provide a valid email');

const passwordRules = (field) => body(field)
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/\d/)
  .withMessage('Password must contain at least one number')
  .matches(/[a-zA-Z]/)
  .withMessage('Password must contain at least one letter');

const validatePassword = passwordRules('password');

const validateName = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2 and 50 characters');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ error: list[0].msg, errors: list });
  }
  next();
};

// Auth validators
const validateRegister = [
  validateEmail,
  validatePassword,
  validateName,
  handleValidationErrors
];

const validateLogin = [
  validateEmail,
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordRules('newPassword'),
  handleValidationErrors
];

const validateProfile = [
  validateName,
  handleValidationErrors
];

const validatePasswordResetRequest = [
  validateEmail,
  handleValidationErrors
];

const validatePasswordReset = [
  param('token')
    .isHexadecimal()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token'),
  validatePassword,
  handleValidationErrors
];

// Product validators
const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name too long'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('image')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Image must be a URL'),
  body('featured').optional().isBoolean().toBoolean(),
  handleValidationErrors
];

// Same rules, but every field is optional for partial updates
const validateProductUpdate = [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }).withMessage('Invalid product name'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('image').optional({ values: 'falsy' }).isURL().withMessage('Image must be a URL'),
  body('featured').optional().isBoolean().toBoolean(),
  body('active').optional().isBoolean().toBoolean(),
  handleValidationErrors
];

// Cart validators
const validateAddToCart = [
  body('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// A cart held in the browser: [{ productId, quantity }]
const validateCartItems = (field) => [
  body(field)
    .isArray({ max: 50 })
    .withMessage('Cart must be a list of at most 50 items'),
  body(`${field}.*.productId`)
    .isUUID()
    .withMessage('Invalid product ID'),
  body(`${field}.*.quantity`)
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
    .toInt()
];

const validateCartQuote = [
  ...validateCartItems('items'),
  body('discountCode').optional({ values: 'falsy' }).isString().trim(),
  handleValidationErrors
];

const validateCartMerge = [
  ...validateCartItems('guestCartItems'),
  handleValidationErrors
];

const validateUpdateCart = [
  param('id')
    .isUUID()
    .withMessage('Invalid cart item ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// Order validators
const validateOrder = [
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('shippingAddress.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  // UK address: county is optional
  body('shippingAddress.state')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 100 }),
  // UK postcode, stored uppercase with a single space: "ab101xg" -> "AB10 1XG"
  body('shippingAddress.zipCode')
    .trim()
    .customSanitizer(value => String(value).toUpperCase().replace(/\s+/g, '').replace(/^(.+)(\d[A-Z]{2})$/, '$1 $2'))
    .matches(/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/)
    .withMessage('Enter a valid UK postcode'),
  body('discountCode')
    .optional({ values: 'falsy' })
    .isString()
    .trim(),
  handleValidationErrors
];

const validateOrderStatus = [
  body('status')
    .isIn(['shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be shipped, delivered or cancelled'),
  body('trackingNumber')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 100 }),
  handleValidationErrors
];

// ID validators
const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query validators
// Empty values (?sort=&page=) count as unset: the storefront sends them
const validatePagination = [
  query('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional({ values: 'falsy' })
    .isIn(['price_asc', 'price_desc', 'name', 'createdAt'])
    .withMessage('Invalid sort option'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateProfile,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProduct,
  validateProductUpdate,
  validateOrderStatus,
  validateAddToCart,
  validateUpdateCart,
  validateCartQuote,
  validateCartMerge,
  validateOrder,
  validateUUID,
  validatePagination,
  handleValidationErrors
};