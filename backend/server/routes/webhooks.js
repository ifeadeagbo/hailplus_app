const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook - needs raw body
router.post('/stripe', 
  express.raw({ type: 'application/json' }), 
  webhookController.handleStripeWebhook
);

module.exports = router;