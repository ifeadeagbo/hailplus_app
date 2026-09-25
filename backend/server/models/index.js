const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');

// Define associations
User.hasMany(Cart, { foreignKey: 'userId', as: 'carts' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Cart, { foreignKey: 'productId', as: 'cartItems' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Product,
  Cart,
  Order
};