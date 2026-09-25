const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentIntentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  billingAddress: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Order;