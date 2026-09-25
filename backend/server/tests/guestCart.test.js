jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const stripe = require('../config/stripe');
const emailService = require('../utils/emailService');
const { resetDb, client, createUser, createAdmin, createProduct, loginAs, address, closeAll } = require('./helpers/app');

beforeEach(async () => {
  await resetDb();
  stripe.__reset();
  jest.clearAllMocks();
});
afterAll(closeAll);

describe('guest cart quote', () => {
  test('prices a browser cart without logging in, with the same totals as a real cart', async () => {
    const product = await createProduct({ price: '14.99', stock: 10 });
    const guest = await client().post('/api/cart/quote', {
      items: [{ productId: product.id, quantity: 2 }],
      discountCode: 'welcome10'
    });

    const user = await loginAs(await createUser());
    await user.post('/api/cart', { productId: product.id, quantity: 2 });
    const real = await user.get('/api/cart?discountCode=WELCOME10');

    expect(guest.status).toBe(200);
    expect(guest.body.summary).toEqual(real.body.summary);
    expect(guest.body.discount.code).toBe('WELCOME10');
    expect(guest.body.items[0]).toMatchObject({ productId: product.id, quantity: 2 });
    expect(guest.body.items[0].Product.name).toBe(product.name);
  });

  test('caps quantities at stock and reports unavailable products', async () => {
    const limited = await createProduct({ stock: 1 });
    const hidden = await createProduct({ active: false });
    const soldOut = await createProduct({ stock: 0 });

    const res = await client().post('/api/cart/quote', {
      items: [
        { productId: limited.id, quantity: 5 },
        { productId: hidden.id, quantity: 1 },
        { productId: soldOut.id, quantity: 1 }
      ]
    });

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(1);
    expect(res.body.unavailable.sort()).toEqual([hidden.id, soldOut.id].sort());
  });

  test('rejects malformed items', async () => {
    const bad = [
      { items: 'not-a-list' },
      { items: [{ productId: 'nope', quantity: 1 }] },
      { items: [{ productId: '8f14e45f-ceea-467a-9575-000000000000', quantity: 0 }] },
      { items: [{ productId: '8f14e45f-ceea-467a-9575-000000000000', quantity: -5 }] }
    ];
    for (const body of bad) {
      expect((await client().post('/api/cart/quote', body)).status).toBe(400);
    }
  });
});

describe('merging the guest cart at login', () => {
  test('adds guest items, combines duplicates and respects stock', async () => {
    const shared = await createProduct({ stock: 4 });
    const guestOnly = await createProduct({ stock: 10 });
    const c = await loginAs(await createUser());
    await c.post('/api/cart', { productId: shared.id, quantity: 3 });

    const res = await c.post('/api/cart/merge', {
      guestCartItems: [
        { productId: shared.id, quantity: 3 },
        { productId: guestOnly.id, quantity: 2 }
      ]
    });

    expect(res.status).toBe(200);
    const items = (await c.get('/api/cart')).body.items;
    const quantities = Object.fromEntries(items.map(i => [i.productId, i.quantity]));
    expect(quantities).toEqual({ [shared.id]: 4, [guestOnly.id]: 2 });
  });

  test('skips unavailable products and rejects negative quantities', async () => {
    const hidden = await createProduct({ active: false });
    const c = await loginAs(await createUser());

    const skipped = await c.post('/api/cart/merge', { guestCartItems: [{ productId: hidden.id, quantity: 1 }] });
    expect(skipped.body.failedItems).toHaveLength(1);

    const negative = await c.post('/api/cart/merge', { guestCartItems: [{ productId: hidden.id, quantity: -5 }] });
    expect(negative.status).toBe(400);
  });

  test('an empty guest cart is fine', async () => {
    const c = await loginAs(await createUser());
    const res = await c.post('/api/cart/merge', { guestCartItems: [] });
    expect(res.status).toBe(200);
    expect(res.body.mergedItems).toBe(0);
  });
});

describe('shipping notification', () => {
  test('is emailed when an admin marks an order shipped', async () => {
    const buyer = await createUser();
    const c = await loginAs(buyer);
    await c.post('/api/cart', { productId: (await createProduct()).id, quantity: 1 });
    const { order } = (await c.post('/api/orders', { shippingAddress: address })).body;
    stripe.__setStatus(order.paymentIntentId, 'succeeded');
    await c.post(`/api/orders/${order.id}/confirm-payment`);

    const admin = await loginAs(await createAdmin());
    await admin.put(`/api/admin/orders/${order.id}`, { status: 'shipped', trackingNumber: '1Z999' });

    expect(emailService.sendShippingNotification).toHaveBeenCalledTimes(1);
    expect(emailService.sendShippingNotification).toHaveBeenCalledWith(
      buyer.email,
      expect.objectContaining({ trackingNumber: '1Z999' })
    );
  });
});
