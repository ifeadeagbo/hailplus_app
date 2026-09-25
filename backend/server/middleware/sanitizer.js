const validator = require('validator');

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any HTML tags
        obj[key] = validator.escape(obj[key]);
        // Trim whitespace
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  // Sanitize body, query, and params
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// Prevent NoSQL injection
const preventNoSQLInjection = (req, res, next) => {
  // Remove any $ or . characters from keys
  const clean = (obj) => {
    for (let key in obj) {
      if (/[$.]/.test(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        clean(obj[key]);
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
};

module.exports = {
  sanitizeInput,
  preventNoSQLInjection
};