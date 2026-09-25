// In-memory stand-in for the parts of the Stripe SDK the app uses.
// Tests drive payment outcomes with the __ helpers.
const state = { intents: new Map(), refunds: [], seq: 0 };

const stripeError = (message, code) =>
  Object.assign(new Error(message), { type: 'StripeInvalidRequestError', code });

const findIntent = (id) => {
  const intent = state.intents.get(id);
  if (!intent) throw stripeError(`No such payment_intent: '${id}'`, 'resource_missing');
  return intent;
};

const stripeMock = {
  paymentIntents: {
    create: jest.fn(async (params) => {
      const id = `pi_test_${++state.seq}`;
      const intent = {
        id,
        object: 'payment_intent',
        amount: params.amount,
        currency: params.currency,
        status: 'requires_payment_method',
        client_secret: `${id}_secret_test`,
        metadata: params.metadata
      };
      state.intents.set(id, intent);
      return { ...intent };
    }),
    retrieve: jest.fn(async (id) => ({ ...findIntent(id) })),
    cancel: jest.fn(async (id) => {
      const intent = findIntent(id);
      if (intent.status === 'succeeded') {
        throw stripeError('This PaymentIntent has already succeeded', 'payment_intent_unexpected_state');
      }
      intent.status = 'canceled';
      return { ...intent };
    })
  },

  refunds: {
    create: jest.fn(async ({ payment_intent }, options = {}) => {
      const existing = options.idempotencyKey && state.refunds.find(r => r.key === options.idempotencyKey);
      if (existing) return existing.refund;
      const refund = { id: `re_test_${++state.seq}`, payment_intent, status: 'succeeded' };
      state.refunds.push({ key: options.idempotencyKey, refund });
      return refund;
    })
  },

  webhooks: {
    constructEvent: jest.fn((body, signature) => {
      if (signature !== 'valid-signature') {
        throw new Error('No signatures found matching the expected signature for payload');
      }
      return JSON.parse(body.toString());
    })
  },

  // Test helpers
  __setStatus(id, status) {
    findIntent(id).status = status;
  },
  __refunds() {
    return state.refunds.map(r => r.refund);
  },
  __reset() {
    state.intents.clear();
    state.refunds.length = 0;
  }
};

module.exports = stripeMock;
