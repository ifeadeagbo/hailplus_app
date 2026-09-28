const crypto = require('crypto');

// Generate random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format price
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

// Paginate results
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    limit: parseInt(limit),
    offset
  };
};

// Calculate order total
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);
};

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

// Sanitize user data for response
const sanitizeUser = (user) => {
  const sanitized = user.toJSON ? user.toJSON() : { ...user };
  delete sanitized.password;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpires;
  delete sanitized.tokenVersion;
  delete sanitized.twoFactorSecret;
  delete sanitized.twoFactorRecoveryCodes;
  delete sanitized.twoFactorLastStep;
  delete sanitized.emailVerificationToken;
  delete sanitized.emailVerificationExpires;
  return sanitized;
};

// Check if order can be cancelled
const canCancelOrder = (order) => {
  const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];
  return !nonCancellableStatuses.includes(order.status);
};

// Calculate shipping cost
const calculateShipping = (subtotal, method = 'standard') => {
  const shippingRates = {
    standard: subtotal > 100 ? 0 : 10,
    express: 25,
    overnight: 50
  };
  return shippingRates[method] || shippingRates.standard;
};

// Generate SKU for product
const generateSKU = (category, name) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${categoryCode}-${nameCode}-${random}`;
};

// Validate credit card (basic validation)
const validateCreditCard = (number) => {
  // Remove spaces and dashes
  const cleanNumber = number.replace(/[\s-]/g, '');
  
  // Check if it's a number and has valid length
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

module.exports = {
  generateToken,
  formatPrice,
  paginate,
  calculateOrderTotal,
  generateOrderNumber,
  sanitizeUser,
  canCancelOrder,
  calculateShipping,
  generateSKU,
  validateCreditCard
};