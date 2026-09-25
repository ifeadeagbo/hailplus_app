jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const stripe = require('../config/stripe');
const { Order, Product, User } = require('../models');
const {
  resetDb, createUser, createAdmin, createProduct, loginAs, address, closeAll, client, request, app
} = require('./helpers/app');

beforeEach(async () => {
  await resetDb();
  stripe.__reset();
});
afterAll(closeAll);

const paidOrder = async (product) => {
  const c = await loginAs(await createUser());
  await c.post('/api/cart', { productId: product.id, quantity: 1 });
  const { order } = (await c.post('/api/orders', { shippingAddress: address })).body;
  stripe.__setStatus(order.paymentIntentId, 'succeeded');
  await c.post(`/api/orders/${order.id}/confirm-payment`);
  return order;
};

describe('access control', () => {
  test('customers cannot use admin endpoints', async () => {
    const c = await loginAs(await createUser());
    expect((await c.get('/api/admin/dashboard')).status).toBe(403);
    expect((await c.post('/api/products', { name: 'X' })).status).toBe(403);
    expect((await c.get('/api/users')).status).toBe(403);
  });

  test('guests are asked to log in', async () => {
    expect((await client().get('/api/admin/dashboard')).status).toBe(401);
  });

  test('admin dashboard works', async () => {
    const admin = await loginAs(await createAdmin());
    const res = await admin.get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers', 1);
  });
});

describe('order status changes', () => {
  test('orders move forward: processing -> shipped -> delivered', async () => {
    const admin = await loginAs(await createAdmin());
    const order = await paidOrder(await createProduct());

    const shipped = await admin.put(`/api/admin/orders/${order.id}`, { status: 'shipped', trackingNumber: '1Z999' });
    expect(shipped.body).toMatchObject({ status: 'shipped', trackingNumber: '1Z999' });
    expect((await admin.put(`/api/admin/orders/${order.id}`, { status: 'delivered' })).status).toBe(200);
  });

  test('invalid transitions are rejected', async () => {
    const admin = await loginAs(await createAdmin());
    const order = await paidOrder(await createProduct());
    await admin.put(`/api/admin/orders/${order.id}`, { status: 'delivered' });

    expect((await admin.put(`/api/admin/orders/${order.id}`, { status: 'shipped' })).status).toBe(400);
    expect((await admin.put(`/api/admin/orders/${order.id}`, { status: 'pending' })).status).toBe(400);
  });

  test('cancelling a paid order refunds it and restores stock', async () => {
    const admin = await loginAs(await createAdmin());
    const product = await createProduct({ stock: 5 });
    const order = await paidOrder(product);

    const res = await admin.put(`/api/admin/orders/${order.id}`, { status: 'cancelled' });
    expect(res.body.status).toBe('cancelled');
    expect(stripe.__refunds()).toHaveLength(1);
    expect((await Product.findByPk(product.id)).stock).toBe(5);
  });
});

describe('users', () => {
  test('admins cannot change their own role', async () => {
    const adminUser = await createAdmin();
    const admin = await loginAs(adminUser);
    expect((await admin.put(`/api/admin/users/${adminUser.id}/role`, { role: 'customer' })).status).toBe(400);
  });

  test('admin edits ignore protected fields', async () => {
    const admin = await loginAs(await createAdmin());
    const user = await createUser();

    const res = await admin.put(`/api/users/${user.id}`, { name: 'Edited', role: 'admin', email: 'x@example.com', tokenVersion: 99 });
    expect(res.status).toBe(200);
    await user.reload();
    expect(user).toMatchObject({ name: 'Edited', role: 'customer' });
    expect(user.email).not.toBe('x@example.com');
    expect(user.tokenVersion).toBe(0);
  });

  test('deleting a user deactivates them and keeps their orders', async () => {
    const admin = await loginAs(await createAdmin());
    const order = await paidOrder(await createProduct());

    await admin.delete(`/api/users/${order.userId}`);
    expect((await User.findByPk(order.userId)).active).toBe(false);
    expect(await Order.findByPk(order.id)).not.toBeNull();
  });

  test('the database refuses to hard-delete a user with orders', async () => {
    const order = await paidOrder(await createProduct());
    await expect(User.destroy({ where: { id: order.userId } })).rejects.toThrow(/foreign key/);
  });
});

describe('products', () => {
  test('unknown fields are ignored on create', async () => {
    const admin = await loginAs(await createAdmin());
    const res = await admin.post('/api/products', {
      name: 'Widget', description: 'A widget', price: 9.99, category: 'Tools', stock: 5,
      id: '00000000-0000-0000-0000-000000000000'
    });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe('00000000-0000-0000-0000-000000000000');
  });

  test('image must be a real URL', async () => {
    const admin = await loginAs(await createAdmin());
    const res = await admin.post('/api/products', {
      name: 'Widget', description: 'A widget', price: 9.99, category: 'Tools', stock: 5, image: 'javascript:alert(1)'
    });
    expect(res.status).toBe(400);
  });

  test('deleted products disappear from the storefront', async () => {
    const admin = await loginAs(await createAdmin());
    const product = await createProduct();
    await admin.delete(`/api/products/${product.id}`);

    expect((await client().get(`/api/products/${product.id}`)).status).toBe(404);
    expect((await client().get('/api/products')).body.products).toHaveLength(0);
  });
});

describe('input handling', () => {
  test('malformed ids return 400, not a server error', async () => {
    expect((await client().get('/api/products/not-a-uuid')).status).toBe(400);
  });

  test('page size is capped', async () => {
    expect((await client().get('/api/products?limit=100000')).status).toBe(400);
  });

  test('unknown API routes return JSON 404', async () => {
    const res = await client().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  test('health check reports the database is reachable', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
