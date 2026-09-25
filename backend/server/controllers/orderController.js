const { sequelize, Order, Cart, Product } = require('../models');
const stripe = require('../config/stripe');
const { CURRENCY, calculateTotals, findDiscount } = require('../utils/pricing');
const {
  markOrderPaid,
  cancelUnpaidOrder,
  refundPaidOrder
} = require('../utils/orderLifecycle');

// Creates a pending order, reserves its stock and returns a PaymentIntent
// client secret. The browser confirms the payment with Stripe; the order is
// marked paid by the webhook or by confirmPayment below.
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, billingAddress, discountCode } = req.body;
    
    if (discountCode && !findDiscount(discountCode)) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }
    
    // Only one unpaid checkout per user: release stock held by earlier attempts
    const previousAttempts = await Order.findAll({
      where: { userId: req.user.id, status: 'pending' }
    });
    for (const previous of previousAttempts) {
      await cancelUnpaidOrder(previous);
    }
    
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id, isActive: true }
    });
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    const result = await sequelize.transaction(async (transaction) => {
      // Lock the product rows so concurrent checkouts can't oversell
      const products = await Product.findAll({
        where: { id: cartItems.map(item => item.productId) },
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      const productsById = new Map(products.map(product => [product.id, product]));
      
      const issues = [];
      for (const item of cartItems) {
        const product = productsById.get(item.productId);
        if (!product || !product.active) {
          issues.push({ productId: item.productId, issue: 'Product no longer available' });
        } else if (product.stock < item.quantity) {
          issues.push({
            productId: item.productId,
            productName: product.name,
            issue: `Only ${product.stock} left in stock`
          });
        }
      }
      if (issues.length > 0) {
        const error = new Error('Some items in your cart are unavailable');
        error.status = 409;
        error.issues = issues;
        throw error;
      }
      
      const orderItems = cartItems.map(item => {
        const product = productsById.get(item.productId);
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        };
      });
      const totals = calculateTotals(orderItems, discountCode);
      
      for (const item of orderItems) {
        await productsById.get(item.productId).decrement('stock', {
          by: item.quantity,
          transaction
        });
      }
      
      const order = await Order.create({
        userId: req.user.id,
        items: orderItems,
        subtotal: totals.subtotal,
        discountCode: totals.discount?.code || null,
        discountAmount: totals.discountAmount,
        tax: totals.tax,
        shipping: totals.shipping,
        totalAmount: totals.total,
        status: 'pending',
        paymentMethod: 'card',
        shippingAddress,
        billingAddress: billingAddress || shippingAddress
      }, { transaction });
      
      // Created inside the transaction: if Stripe fails, the order and the
      // stock reservation are rolled back
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totals.cents.total,
        currency: CURRENCY,
        payment_method_types: ['card'],
        receipt_email: req.user.email,
        metadata: {
          orderId: order.id,
          userId: req.user.id
        }
      }, {
        idempotencyKey: `order-${order.id}`
      });
      
      order.paymentIntentId = paymentIntent.id;
      await order.save({ transaction });
      
      return { order, clientSecret: paymentIntent.client_secret };
    });
    
    res.status(201).json(result);
  } catch (error) {
    if (error.issues) {
      return res.status(error.status).json({ error: error.message, issues: error.issues });
    }
    next(error);
  }
};

// Called by the browser after Stripe confirms the payment. Checks the
// PaymentIntent with Stripe directly, so it works even before webhooks are set up.
exports.confirmPayment = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status === 'pending' && order.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        await markOrderPaid(order);
        await order.reload();
      }
    }
    
    res.json(order);
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
    
    if (order.status === 'pending') {
      await cancelUnpaidOrder(order);
      await order.reload();
    }
    
    // Either it was already paid, or the payment landed while cancelling
    if (order.status === 'processing') {
      await refundPaidOrder(order);
      await order.reload();
    }
    
    if (order.status !== 'cancelled') {
      return res.status(409).json({ error: 'Order status changed, please try again' });
    }
    
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
};
