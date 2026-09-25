const { User, Product, Order } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count({ where: { active: true } });
    const totalOrders = await Order.count();
    
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    
    const revenue = await Order.sum('totalAmount', {
      where: { status: ['delivered', 'processing', 'shipped'] }
    });
    
    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      revenue: revenue || 0,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    
    res.json({
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (role) where.role = role;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
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