// CSRF protection for cookie-based auth. State-changing requests must carry
// a custom header. Browsers only let another site send custom headers after
// a CORS preflight, which our CORS policy rejects for unknown origins.
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const requireAjaxHeader = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method) || req.get('X-Requested-With') === 'XMLHttpRequest') {
    return next();
  }
  res.status(403).json({ error: 'Missing X-Requested-With header' });
};

module.exports = requireAjaxHeader;
