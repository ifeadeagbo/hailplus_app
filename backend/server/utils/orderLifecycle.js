// Order state transitions shared by the order controller, Stripe webhooks
// and the stale-order sweeper. Every transition uses a conditional update
// (WHERE status = <expected>) so it runs exactly once, even when a webhook
// and a client request race each other.

const { Op } = require('sequelize');
const { sequelize, Order, Cart, Product, User } = require('../models');
const stripe = require('../config/stripe');
const emailService = require('./emailService');
const logger = require('./logger');

const PENDING_ORDER_TTL_MINUTES = 30;

const restock = async (order, transaction) => {
  for (const item of order.items) {
    await Product.increment('stock', {
      by: item.quantity,
      where: { id: item.productId },
      transaction
    });
  }
};

// pending -> processing. Clears the purchased items from the cart and sends
// the confirmation email. Returns true only for the call that made the change.
const markOrderPaid = async (order) => {
  const [updated] = await Order.update(
    { status: 'processing' },
    { where: { id: order.id, status: 'pending' } }
  );
  if (!updated) return false;

  await Cart.update(
    { isActive: false },
    {
      where: {
        userId: order.userId,
        isActive: true,
        productId: order.items.map(item => item.productId)
      }
    }
  );

  await order.reload();
  const user = await User.findByPk(order.userId);
  if (user) {
    await emailService.sendOrderConfirmation(user.email, order);
  }

  logger.info(`Order ${order.id} paid`);
  return true;
};

// Moves an order to cancelled and puts its items back in stock
const cancelAndRestock = (order, fromStatus) =>
  sequelize.transaction(async (transaction) => {
    const [updated] = await Order.update(
      { status: 'cancelled' },
      { where: { id: order.id, status: fromStatus }, transaction }
    );
    if (!updated) return false;

    await restock(order, transaction);
    return true;
  });

// pending -> cancelled. Checks Stripe first so an order that was paid in the
// meantime is marked paid instead of cancelled.
const cancelUnpaidOrder = async (order) => {
  if (order.paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await markOrderPaid(order);
      return false;
    }

    if (paymentIntent.status !== 'canceled') {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    }
  }

  return cancelAndRestock(order, 'pending');
};

// processing -> cancelled, with a full refund. The refund runs inside the
// transaction so a failed refund leaves the order and stock untouched.
const refundPaidOrder = (order) =>
  sequelize.transaction(async (transaction) => {
    const [updated] = await Order.update(
      { status: 'cancelled' },
      { where: { id: order.id, status: 'processing' }, transaction }
    );
    if (!updated) return false;

    await restock(order, transaction);
    await stripe.refunds.create(
      { payment_intent: order.paymentIntentId },
      { idempotencyKey: `refund-${order.id}` }
    );
    return true;
  });

// Releases stock held by checkouts that were never paid
const expireStaleOrders = async () => {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
  const staleOrders = await Order.findAll({
    where: { status: 'pending', createdAt: { [Op.lt]: cutoff } }
  });

  for (const order of staleOrders) {
    try {
      if (await cancelUnpaidOrder(order)) {
        logger.info(`Expired unpaid order ${order.id}`);
      }
    } catch (error) {
      logger.error(`Failed to expire order ${order.id}`, error);
    }
  }
};

module.exports = {
  markOrderPaid,
  cancelAndRestock,
  cancelUnpaidOrder,
  refundPaidOrder,
  expireStaleOrders
};
