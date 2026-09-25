const logger = require('../utils/logger');

// Internal error details are logged, never sent to the client.
// Responses use the same { error: message } shape as the controllers.
const errorHandler = (err, req, res, next) => {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: err.errors?.[0]?.message || 'Validation failed',
      details: err.errors?.map(e => ({ field: e.path, message: e.message }))
    });
  }

  // Malformed JSON bodies and other client errors raised by middleware
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed`, err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
