const { User, Product, Order } = require('../models');
const { cancelUnpaidOrder, refundPaidOrder } = require('../utils/orderLifecycle');
const emailService = require('../utils/emailService');

// Statuses an admin can move an order to from its current status.
// Cancellation goes through the order lifecycle so stock is restored and
// paid orders are refunded.
const ALLOWED_TRANSITIONS = {
  pending: ['cancelled'],
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered']
};

const pagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

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
    const { status } = req.query;
    const { page, limit, offset } = pagination(req.query);
    const where = {};
    
    if (status) where.status = status;
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    
    res.json({
      orders: rows,
      total: count,
      page,
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
    
    if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(status)) {
      return res.status(400).json({ error: `Cannot change a ${order.status} order to ${status}` });
    }
    
    if (status === 'cancelled') {
      if (order.status === 'pending') {
        await cancelUnpaidOrder(order);
      } else {
        await refundPaidOrder(order);
      }
      await order.reload();
      if (order.status !== 'cancelled') {
        return res.status(409).json({ error: 'Order status changed, please refresh and try again' });
      }
      return res.json(order);
    }
    
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();
    
    if (status === 'shipped') {
      const user = await order.getUser();
      emailService.sendShippingNotification(user.email, order);
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const { page, limit, offset } = pagination(req.query);
    const where = {};
    
    if (role) where.role = role;
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'tokenVersion'] },
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