jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const stripe = require('../config/stripe');
const emailService = require('../utils/emailService');
const { Order, Product } = require('../models');
const { resetDb, createUser, createProduct, loginAs, address, closeAll, request, app } = require('./helpers/app');

beforeEach(async () => {
  await resetDb();
  stripe.__reset();
  jest.clearAllMocks();
});
afterAll(closeAll);

const sendEvent = (event, signature = 'valid-signature') =>
  request(app)
    .post('/api/webhooks/stripe')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', signature)
    .send(JSON.stringify(event));

const pendingOrder = async (product) => {
  const c = await loginAs(await createUser());
  await c.post('/api/cart', { productId: product.id, quantity: 1 });
  return (await c.post('/api/orders', { shippingAddress: address })).body.order;
};

test('rejects events with a bad signature', async () => {
  const res = await sendEvent({ type: 'payment_intent.succeeded' }, 'forged');
  expect(res.status).toBe(400);
});

test('does not need the CSRF header (Stripe cannot send it)', async () => {
  const res = await sendEvent({ type: 'customer.created', data: { object: {} } });
  expect(res.status).toBe(200);
});

test('payment_intent.succeeded marks the order paid, once', async () => {
  const order = await pendingOrder(await createProduct());
  const event = { type: 'payment_intent.succeeded', data: { object: { id: order.paymentIntentId } } };

  expect((await sendEvent(event)).status).toBe(200);
  expect((await sendEvent(event)).status).toBe(200); // Stripe may deliver twice

  expect((await Order.findByPk(order.id)).status).toBe('processing');
  expect(emailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
});

test('a declined attempt does not cancel the order (customer can retry)', async () => {
  const order = await pendingOrder(await createProduct());
  await sendEvent({ type: 'payment_intent.payment_failed', data: { object: { id: order.paymentIntentId } } });
  expect((await Order.findByPk(order.id)).status).toBe('pending');
});

test('payment_intent.canceled cancels and restocks', async () => {
  const product = await createProduct({ stock: 3 });
  const order = await pendingOrder(product);

  await sendEvent({ type: 'payment_intent.canceled', data: { object: { id: order.paymentIntentId } } });

  expect((await Order.findByPk(order.id)).status).toBe('cancelled');
  expect((await Product.findByPk(product.id)).stock).toBe(3);
});

test('a refund issued from the Stripe Dashboard marks the order refunded', async () => {
  const order = await pendingOrder(await createProduct());
  await Order.update({ status: 'shipped' }, { where: { id: order.id } });

  await sendEvent({ type: 'charge.refunded', data: { object: { payment_intent: order.paymentIntentId, amount_refunded: 1000 } } });

  expect((await Order.findByPk(order.id)).status).toBe('refunded');
  expect(emailService.sendRefundConfirmation).toHaveBeenCalledWith(expect.any(String), expect.anything(), 10);
});

test('handler errors return 500 so Stripe retries', async () => {
  const order = await pendingOrder(await createProduct());
  jest.spyOn(Order, 'findOne').mockRejectedValueOnce(new Error('database blip'));

  const res = await sendEvent({ type: 'payment_intent.succeeded', data: { object: { id: order.paymentIntentId } } });
  expect(res.status).toBe(500);
});
