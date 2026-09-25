const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    // Check for token in header or session
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.session?.token;
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.active) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.session?.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user?.active) req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };