const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Order, Cart } = require('../models');
const { issueAuthCookie, clearAuthCookie, publicUser } = require('../utils/authCookie');
const twoFactor = require('../utils/twoFactor');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

const VERIFICATION_DAYS = 7;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Emails a fresh confirmation link (the token is stored only as a hash)
const sendVerification = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  await user.update({
    emailVerificationToken: hashToken(token),
    emailVerificationExpires: new Date(Date.now() + VERIFICATION_DAYS * 24 * 60 * 60 * 1000)
  });
  // Not awaited: sign-up must not wait on the mail server
  emailService.sendEmailVerification(user.email, user.name, token);
};

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

    await sendVerification(user);
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

    // Password is right; the authenticator code comes next
    if (user.twoFactorEnabled) {
      twoFactor.issuePendingCookie(res, user);
      return res.json({ twoFactorRequired: true });
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
  if (req.user.twoFactorEnabled) {
    twoFactor.issuePendingCookie(res, req.user);
    return res.redirect(`${process.env.CLIENT_URL}/login?twofactor=1`);
  }
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
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
        twoFactorLastStep: null,
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

// --- Two-factor sign-in -------------------------------------------------

// Second step of sign-in: authenticator code or recovery code
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const pending = twoFactor.readPendingCookie(req);
    const user = pending && await User.findByPk(pending.id);
    if (!user || !user.active || !user.twoFactorEnabled || user.tokenVersion !== pending.tv) {
      twoFactor.clearPendingCookie(res);
      return res.status(401).json({ error: 'Your sign-in expired. Please sign in again.' });
    }

    if (!(await twoFactor.verifyAndConsume(user, req.body.code))) {
      return res.status(401).json({ error: 'That code is not valid. Check your authenticator app and try again.' });
    }

    twoFactor.clearPendingCookie(res);
    issueAuthCookie(res, user);
    res.json({ message: 'Login successful', user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

// Step 1 of turning 2FA on: a secret and QR code (not active until confirmed)
exports.setupTwoFactor = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor sign-in is already on' });
    }
    const { encryptedSecret, secret, qrCode } = await twoFactor.createSetup(req.user);
    await req.user.update({ twoFactorSecret: encryptedSecret, twoFactorLastStep: null });
    res.json({ qrCode, secret });
  } catch (error) {
    next(error);
  }
};

// Step 2: confirm with a code from the app; returns one-time recovery codes
exports.enableTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor sign-in is already on' });
    }
    const step = twoFactor.checkAuthenticatorCode(user, String(req.body.code || '').trim());
    if (step === null) {
      return res.status(400).json({ error: 'That code is not valid. Scan the QR code again and enter the current code.' });
    }

    const recoveryCodes = twoFactor.generateRecoveryCodes();
    await user.update({
      twoFactorEnabled: true,
      twoFactorLastStep: step,
      twoFactorRecoveryCodes: recoveryCodes.map(twoFactor.hashCode),
      tokenVersion: user.tokenVersion + 1 // sign out other devices
    });
    issueAuthCookie(res, user);
    res.json({ message: 'Two-factor sign-in is on', recoveryCodes, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

// Turning 2FA off needs the password (if any) and a current or recovery code
exports.disableTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor sign-in is not on' });
    }
    if (user.password && !(req.body.password && await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }
    if (!(await twoFactor.verifyAndConsume(user, req.body.code))) {
      return res.status(401).json({ error: 'That code is not valid' });
    }

    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
      twoFactorLastStep: null
    });
    res.json({ message: 'Two-factor sign-in is off', user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

// --- Email confirmation ------------------------------------------------

// Opened from the link in the confirmation email (no sign-in needed)
exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        emailVerificationToken: hashToken(req.params.token),
        emailVerificationExpires: { [Op.gt]: new Date() }
      }
    });
    if (!user) {
      return res.status(400).json({ error: 'This link is invalid or has expired. Sign in and request a new one.' });
    }
    await user.update({ emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null });
    res.json({ message: 'Email address confirmed' });
  } catch (error) {
    next(error);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ error: 'Your email address is already confirmed' });
    }
    await sendVerification(req.user);
    res.json({ message: `We've sent a new link to ${req.user.email}` });
  } catch (error) {
    next(error);
  }
};

