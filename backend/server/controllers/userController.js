const { User, Order } = require('../models');
const { Op } = require('sequelize');
const { sanitizeUser } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
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
      attributes: { exclude: ['password', 'resetPasswordToken'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken'] },
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
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.stripeCustomerId;
    
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
    
    // Soft delete - just deactivate the account
    await user.update({ active: false });
    
    res.json({ message: 'User account deactivated' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by model hook
    await user.save();
    
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
    await emailService.sendPasswordReset(email, resetToken);
    
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