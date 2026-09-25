const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AUTH_COOKIE } = require('../utils/authCookie');

// The browser sends the httpOnly cookie; API clients may send a Bearer token
const getToken = (req) =>
  req.cookies?.[AUTH_COOKIE] || req.header('Authorization')?.replace('Bearer ', '');

const loadUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id);

  if (!user || !user.active || user.tokenVersion !== decoded.tv) {
    return null;
  }
  return user;
};

const authenticate = async (req, res, next) => {
  try {
    const token = getToken(req);
    const user = token && await loadUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (token) {
      req.user = await loadUser(token) || undefined;
    }
  } catch (error) {
    // Invalid token: continue as a guest
  }
  next();
};

module.exports = { authenticate, optionalAuth };
