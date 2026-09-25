const bcrypt = require('bcryptjs');
const { User } = require('../models');
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
