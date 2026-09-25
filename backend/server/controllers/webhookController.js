const stripe = require('../config/stripe');
const { Order, Product } = require('../models');
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

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;
      
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
      
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

async function handlePaymentSuccess(paymentIntent) {
  try {
    const order = await Order.findOne({
      where: { paymentIntentId: paymentIntent.id }
    });
    
    if (!order) {
      logger.warn('Order not found for payment intent:', paymentIntent.id);
      return;
    }
    
    // Update order status
    order.status = 'processing';
    await order.save();
    
    // Send confirmation email
    const user = await order.getUser();
    await emailService.sendOrderConfirmation(user.email, order);
    
    logger.info('Payment succeeded for order:', order.id);
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const order = await Order.findOne({
      where: { paymentIntentId: paymentIntent.id }
    });
    
    if (!order) {
      return;
    }
    
    order.status = 'cancelled';
    await order.save();
    
    // Restore product stock
    for (const item of order.items) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }
    
    logger.info('Payment failed for order:', order.id);
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

async function handleRefund(charge) {
  try {
    const order = await Order.findOne({
      where: { paymentIntentId: charge.payment_intent }
    });
    
    if (!order) {
      return;
    }
    
    order.status = 'refunded';
    await order.save();
    
    // Send refund email
    const user = await order.getUser();
    await emailService.sendRefundConfirmation(user.email, order, charge.amount_refunded / 100);
    
    logger.info('Refund processed for order:', order.id);
  } catch (error) {
    logger.error('Error handling refund:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  logger.info('Subscription created:', subscription.id);
  // Implement subscription logic if needed
}

async function handleSubscriptionCanceled(subscription) {
  logger.info('Subscription canceled:', subscription.id);
  // Implement subscription cancellation logic if needed
}

module.exports = exports;