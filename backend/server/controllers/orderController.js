const { Order, Cart, Product } = require('../models');
const stripe = require('../config/stripe');
const emailService = require('../utils/emailService');

exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, billingAddress, paymentMethodId } = req.body;
    
    // Get cart items
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id, isActive: true },
      include: [{ model: Product }]
    });
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Calculate total
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (parseFloat(item.Product.price) * item.quantity);
    }, 0);
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId: req.user.id
      }
    });
    
    // Prepare order items
    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      name: item.Product.name,
      price: item.Product.price,
      quantity: item.quantity
    }));
    
    // Create order
    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      status: 'processing',
      paymentMethod: 'card',
      paymentIntentId: paymentIntent.id,
      shippingAddress,
      billingAddress
    });
    
    // Update product stock
    for (const item of cartItems) {
      await item.Product.update({
        stock: item.Product.stock - item.quantity
      });
    }
    
    // Mark cart items as inactive
    await Cart.update(
      { isActive: false },
      { where: { userId: req.user.id, isActive: true } }
    );
    
    // Send confirmation email
    await emailService.sendOrderConfirmation(req.user.email, order);
    
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }
    
    // Process refund if payment was made
    if (order.paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: order.paymentIntentId
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    await order.save();
    
    // Restore product stock
    for (const item of order.items) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }
    
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
};