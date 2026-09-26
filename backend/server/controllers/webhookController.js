const stripe = require('../config/stripe');
const { Order } = require('../models');
const { markOrderPaid, cancelAndRestock } = require('../utils/orderLifecycle');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handlers are idempotent, so a failure returns 500 and Stripe retries
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        // The customer can retry with another card; unpaid orders are
        // released by the stale-order sweeper
        logger.info(`Payment attempt failed for payment intent ${event.data.object.id}`);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
        
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    logger.error(`Error handling ${event.type}`, error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.json({ received: true });
};

async function handlePaymentSuccess(paymentIntent) {
  const order = await Order.findOne({
    where: { paymentIntentId: paymentIntent.id }
  });
  
  if (!order) {
    logger.warn(`Order not found for payment intent ${paymentIntent.id}`);
    return;
  }
  
  await markOrderPaid(order);
}

async function handlePaymentCanceled(paymentIntent) {
  const order = await Order.findOne({
    where: { paymentIntentId: paymentIntent.id }
  });
  
  if (order) {
    await cancelAndRestock(order, 'pending');
  }
}

// Customer cancellations are already 'cancelled' and restocked by the app.
// Refunds issued elsewhere (e.g. the Stripe Dashboard) mark the order refunded.
async function handleRefund(charge) {
  const order = await Order.findOne({
    where: { paymentIntentId: charge.payment_intent }
  });
  
  if (!order) {
    return;
  }
  
  if (order.status !== 'cancelled') {
    order.status = 'refunded';
    await order.save();
  }
  
  const user = await order.getUser();
  emailService.sendRefundConfirmation(user.email, order, charge.amount_refunded / 100);
  
  logger.info(`Refund processed for order ${order.id}`);
}

module.exports = exports;
