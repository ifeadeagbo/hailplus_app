const crypto = require('crypto');
const logger = require('../utils/logger');

// Tags every request with an ID (returned as X-Request-Id so a customer
// report can be matched to the logs) and logs it when the response ends
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  req.id = req.get('X-Request-Id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const entry = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.user?.id
    };
    if (level === 'error') logger.error('request', entry);
    else logger[level]('request', entry);
  });

  next();
};

module.exports = requestLogger;
