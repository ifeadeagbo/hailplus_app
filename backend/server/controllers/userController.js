const { User, Order } = require('../models');
const { Op } = require('sequelize');
const { sanitizeUser } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const { issueAuthCookie } = require('../utils/authCookie');

// Fields an admin may change on another user's account
const ADMIN_EDITABLE_FIELDS = ['name', 'active'];

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;
    
    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'tokenVersion', 'twoFactorSecret', 'twoFactorRecoveryCodes', 'twoFactorLastStep'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      users: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'tokenVersion', 'twoFactorSecret', 'twoFactorRecoveryCodes', 'twoFactorLastStep'] },
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = Object.fromEntries(
      ADMIN_EDITABLE_FIELDS.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]])
    );
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.update(updates);
    
    res.json({
      message: 'User updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Soft delete - deactivate the account and sign it out everywhere
    await user.update({ active: false, tokenVersion: user.tokenVersion + 1 });
    
    res.json({ message: 'User account deactivated' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user.password) {
      return res.status(400).json({ error: `Your account uses ${user.provider} sign-in and has no password` });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password and sign out other devices
    user.password = newPassword; // Will be hashed by model hook
    user.tokenVersion += 1;
    await user.save();
    
    // Keep this browser signed in with a fresh token
    issueAuthCookie(res, user);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a password reset email has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save token and expiry
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send email
    // Not awaited: also keeps the response time the same whether or not the account exists
    emailService.sendPasswordReset(email, resetToken);
    
    res.json({ message: 'If an account exists, a password reset email has been sent' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Hash the token from URL
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.tokenVersion += 1; // Sign out every existing session
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      message: 'User role updated',
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;