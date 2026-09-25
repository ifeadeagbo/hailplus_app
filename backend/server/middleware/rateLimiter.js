const rateLimit = require('express-rate-limit');

// The test suite sends many requests from one IP; limits only apply there
// when a test opts in with the X-Test-Rate-Limit header. Never skipped outside tests.
const skip = (req) => process.env.NODE_ENV === 'test' && !req.get('X-Test-Rate-Limit');

// General API rate limit
const apiLimiter = rateLimit({
  skip,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  skip,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

// Rate limit for order creation
const orderLimiter = rateLimit({
  skip,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 orders per hour
  message: { error: 'Too many orders placed, please try again later.' },
});

// Rate limit for password reset
const passwordResetLimiter = rateLimit({
  skip,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 password reset requests
  message: { error: 'Too many password reset requests, please try again later.' },
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderLimiter,
  passwordResetLimiter
};