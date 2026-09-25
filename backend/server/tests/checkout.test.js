jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const stripe = require('../config/stripe');
const emailService = require('../utils/emailService');
const { Order, Product, Cart, sequelize } = require('../models');
const { expireStaleOrders } = require('../utils/orderLifecycle');
const { resetDb, createUser, createProduct, loginAs, address, closeAll } = require('./helpers/app');

beforeEach(async () => {
  await resetDb();
  stripe.__reset();
  jest.clearAllMocks();
});
afterAll(closeAll);

const stockOf = async (product) => (await Product.findByPk(product.id)).stock;

// A logged-in buyer with the given products in their cart
const buyerWithCart = async (...lines) => {
  const c = await loginAs(await createUser());
  for (const [product, quantity] of lines) {
    const res = await c.post('/api/cart', { productId: product.id, quantity });
    expect(res.status).toBe(201);
  }
  return c;
};

const placeOrder = (c, extra = {}) => c.post('/api/orders', { shippingAddress: address, ...extra });

describe('placing an order', () => {
  test('charges exactly the total shown in the cart, including discount, tax and shipping', async () => {
    const cheap = await createProduct({ price: '14.99' });
    const mid = await createProduct({ price: '25.50' });
    const c = await buyerWithCart([cheap, 2], [mid, 1]);

    const cart = await c.get('/api/cart?discountCode=WELCOME10');
    const discount = await c.post('/api/cart/discount', { discountCode: 'welcome10' });
    const res = await placeOrder(c, { discountCode: 'WELCOME10' });

    expect(res.status).toBe(201);
    const { order, clientSecret } = res.body;
    expect(clientSecret).toMatch(/^pi_test_/);
    expect(discount.body.discount.finalTotal).toBe(cart.body.summary.total);
    expect(order.totalAmount).toBe(cart.body.summary.total);
    expect(order).toMatchObject({ status: 'pending', discountCode: 'WELCOME10' });

    const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    expect(intent.amount).toBe(Math.round(parseFloat(order.totalAmount) * 100));
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method_types: ['card'], metadata: expect.objectContaining({ orderId: order.id }) }),
      { idempotencyKey: `order-${order.id}` }
    );
  });

  test('reserves stock when the order is placed', async () => {
    const product = await createProduct({ stock: 10 });
    const c = await buyerWithCart([product, 3]);

    await placeOrder(c);
    expect(await stockOf(product)).toBe(7);
  });

  test('rejects an empty cart', async () => {
    const c = await loginAs(await createUser());
    expect((await placeOrder(c)).status).toBe(400);
  });

  test('rejects an invalid discount code', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    expect((await placeOrder(c, { discountCode: 'NOTREAL' })).status).toBe(400);
  });

  test('validates the shipping address', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const res = await c.post('/api/orders', { shippingAddress: { ...address, zipCode: 'abc' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ZIP/);
  });

  test('explains which items are out of stock', async () => {
    const product = await createProduct({ stock: 5 });
    const c = await buyerWithCart([product, 3]);
    await product.update({ stock: 1 });

    const res = await placeOrder(c);
    expect(res.status).toBe(409);
    expect(res.body.issues[0]).toMatchObject({ productId: product.id, issue: 'Only 1 left in stock' });
    expect(await stockOf(product)).toBe(1);
    expect(await Order.count()).toBe(0);
  });

  test('only one of two simultaneous buyers gets the last unit', async () => {
    const product = await createProduct({ stock: 5 });
    const alice = await buyerWithCart([product, 1]);
    const bob = await buyerWithCart([product, 1]);
    await product.update({ stock: 1 });

    const results = await Promise.all([placeOrder(alice), placeOrder(bob)]);

    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await stockOf(product)).toBe(0);
  });

  test('a Stripe failure rolls back the order and the stock reservation', async () => {
    const product = await createProduct({ stock: 4 });
    const c = await buyerWithCart([product, 2]);
    stripe.paymentIntents.create.mockRejectedValueOnce(new Error('Stripe is down'));

    const res = await placeOrder(c);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Something went wrong. Please try again.');
    expect(await Order.count()).toBe(0);
    expect(await stockOf(product)).toBe(4);
  });

  test('a new checkout attempt releases the previous unpaid one', async () => {
    const product = await createProduct({ stock: 10 });
    const c = await buyerWithCart([product, 2]);

    const first = (await placeOrder(c)).body.order;
    const second = (await placeOrder(c)).body.order;

    expect((await Order.findByPk(first.id)).status).toBe('cancelled');
    expect((await Order.findByPk(second.id)).status).toBe('pending');
    expect(await stockOf(product)).toBe(8);
  });
});

describe('confirming payment', () => {
  test('marks the order paid once, clears the cart and emails once', async () => {
    const product = await createProduct();
    const c = await buyerWithCart([product, 1]);
    const { order } = (await placeOrder(c)).body;

    stripe.__setStatus(order.paymentIntentId, 'succeeded');
    const first = await c.post(`/api/orders/${order.id}/confirm-payment`);
    const second = await c.post(`/api/orders/${order.id}/confirm-payment`);

    expect(first.body.status).toBe('processing');
    expect(second.body.status).toBe('processing');
    expect((await c.get('/api/cart')).body.items).toHaveLength(0);
    expect(emailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  test('leaves the order pending when the card was declined', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;

    const res = await c.post(`/api/orders/${order.id}/confirm-payment`);
    expect(res.body.status).toBe('pending');
    expect(emailService.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  test('keeps items added to the cart after checkout started', async () => {
    const bought = await createProduct();
    const later = await createProduct();
    const c = await buyerWithCart([bought, 1]);
    const { order } = (await placeOrder(c)).body;
    await c.post('/api/cart', { productId: later.id, quantity: 1 });

    stripe.__setStatus(order.paymentIntentId, 'succeeded');
    await c.post(`/api/orders/${order.id}/confirm-payment`);

    const items = (await c.get('/api/cart')).body.items;
    expect(items.map(i => i.productId)).toEqual([later.id]);
  });

  test("cannot confirm someone else's order", async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;
    const stranger = await loginAs(await createUser());

    expect((await stranger.post(`/api/orders/${order.id}/confirm-payment`)).status).toBe(404);
  });
});

describe('cancelling', () => {
  test('an unpaid order cancels the payment and restores stock', async () => {
    const product = await createProduct({ stock: 10 });
    const c = await buyerWithCart([product, 2]);
    const { order } = (await placeOrder(c)).body;

    const res = await c.post(`/api/orders/${order.id}/cancel`);
    expect(res.body.order.status).toBe('cancelled');
    expect(await stockOf(product)).toBe(10);
    expect((await stripe.paymentIntents.retrieve(order.paymentIntentId)).status).toBe('canceled');
  });

  test('a paid order is refunded exactly once, even on double click', async () => {
    const product = await createProduct({ stock: 10 });
    const c = await buyerWithCart([product, 1]);
    const { order } = (await placeOrder(c)).body;
    stripe.__setStatus(order.paymentIntentId, 'succeeded');
    await c.post(`/api/orders/${order.id}/confirm-payment`);

    await Promise.all([
      c.post(`/api/orders/${order.id}/cancel`),
      c.post(`/api/orders/${order.id}/cancel`)
    ]);

    expect((await Order.findByPk(order.id)).status).toBe('cancelled');
    expect(stripe.__refunds()).toHaveLength(1);
    expect(await stockOf(product)).toBe(10);
  });

  test('a payment that lands while cancelling is refunded instead of lost', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;
    // Paid at Stripe, but our database has not heard yet
    stripe.__setStatus(order.paymentIntentId, 'succeeded');

    const res = await c.post(`/api/orders/${order.id}/cancel`);
    expect(res.body.order.status).toBe('cancelled');
    expect(stripe.__refunds()).toHaveLength(1);
  });

  test('shipped orders cannot be cancelled by the customer', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;
    await Order.update({ status: 'shipped' }, { where: { id: order.id } });

    expect((await c.post(`/api/orders/${order.id}/cancel`)).status).toBe(400);
  });
});

describe('abandoned checkouts', () => {
  test('unpaid orders older than 30 minutes release their stock', async () => {
    const product = await createProduct({ stock: 5 });
    const c = await buyerWithCart([product, 2]);
    const { order } = (await placeOrder(c)).body;
    await sequelize.query(`UPDATE "Orders" SET "createdAt" = NOW() - INTERVAL '31 minutes' WHERE id = :id`, { replacements: { id: order.id } });

    await expireStaleOrders();

    expect((await Order.findByPk(order.id)).status).toBe('cancelled');
    expect(await stockOf(product)).toBe(5);
  });

  test('recent unpaid orders are left alone', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;

    await expireStaleOrders();
    expect((await Order.findByPk(order.id)).status).toBe('pending');
  });

  test('an order paid just before expiry is marked paid, not cancelled', async () => {
    const c = await buyerWithCart([await createProduct(), 1]);
    const { order } = (await placeOrder(c)).body;
    await sequelize.query(`UPDATE "Orders" SET "createdAt" = NOW() - INTERVAL '31 minutes' WHERE id = :id`, { replacements: { id: order.id } });
    stripe.__setStatus(order.paymentIntentId, 'succeeded');

    await expireStaleOrders();
    expect((await Order.findByPk(order.id)).status).toBe('processing');
  });
});

describe('cart', () => {
  test('cannot add more than is in stock', async () => {
    const product = await createProduct({ stock: 2 });
    const c = await loginAs(await createUser());
    expect((await c.post('/api/cart', { productId: product.id, quantity: 3 })).status).toBe(400);
  });

  test('adding the same product twice increases quantity on one row', async () => {
    const product = await createProduct();
    const c = await buyerWithCart([product, 1], [product, 2]);
    const items = (await c.get('/api/cart')).body.items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  test("cannot change another user's cart item", async () => {
    const owner = await buyerWithCart([await createProduct(), 1]);
    const item = await Cart.findOne();
    const stranger = await loginAs(await createUser());

    expect((await stranger.put(`/api/cart/${item.id}`, { quantity: 5 })).status).toBe(404);
    expect((await owner.get('/api/cart')).body.items[0].quantity).toBe(1);
  });
});
