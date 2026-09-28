const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Order, Cart } = require('../models');
const { issueAuthCookie, clearAuthCookie, publicUser } = require('../utils/authCookie');

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({
      email,
      password,
      name
    });

    issueAuthCookie(res, user);

    res.status(201).json({
      message: 'User created successfully',
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Social login accounts have no password
    if (!user.password) {
      return res.status(401).json({ error: `Please sign in with ${user.provider}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    issueAuthCookie(res, user);

    res.json({
      message: 'Login successful',
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logout successful' });
};

// Social login callback: the user was authenticated by passport
exports.oauthSuccess = (req, res) => {
  issueAuthCookie(res, req.user);
  res.redirect(`${process.env.CLIENT_URL}/`);
};

exports.getProfile = (req, res) => {
  res.json(publicUser(req.user));
};

// Email changes need a verification flow, so only the name is editable for now
exports.updateProfile = async (req, res, next) => {
  try {
    await req.user.update({ name: req.body.name });

    res.json({
      message: 'Profile updated',
      user: publicUser(req.user)
    });
  } catch (error) {
    next(error);
  }
};

// Customer-initiated account deletion (UK GDPR right to erasure).
// Personal details and sign-in are erased; order records are kept because
// UK tax rules require sales records for 6 years.
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.password) {
      if (!req.body.password || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ error: 'Password is incorrect' });
      }
    } else if (req.body.confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Type DELETE to confirm' });
    }

    const openOrders = await Order.count({
      where: { userId: user.id, status: { [Op.in]: ['pending', 'processing', 'shipped'] } }
    });
    if (openOrders > 0) {
      return res.status(409).json({
        error: 'You have orders in progress. Please wait until they are delivered, or cancel them, before deleting your account.'
      });
    }

    if (user.role === 'admin') {
      const otherAdmins = await User.count({ where: { role: 'admin', active: true, id: { [Op.ne]: user.id } } });
      if (otherAdmins === 0) {
        return res.status(409).json({ error: 'You are the only admin. Make someone else an admin before deleting your account.' });
      }
    }

    await sequelize.transaction(async (transaction) => {
      await Cart.destroy({ where: { userId: user.id }, transaction });
      await user.update({
        name: 'Deleted customer',
        email: `deleted-${user.id}@deleted.invalid`,
        password: null,
        provider: 'deleted',
        googleId: null,
        facebookId: null,
        stripeCustomerId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        emailVerified: false,
        active: false,
        tokenVersion: user.tokenVersion + 1
      }, { transaction });
    });

    clearAuthCookie(res);
    res.json({ message: 'Your account has been deleted' });
  } catch (error) {
    next(error);
  }
};
