// Shared test helpers. Test files must mock Stripe and email before
// requiring this file:
//   jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
//   jest.mock('../utils/emailService');
const request = require('supertest');
const app = require('../../app');
const { sequelize, User, Product } = require('../../models');

const AJAX = { 'X-Requested-With': 'XMLHttpRequest' };

let counter = 0;
const unique = () => `${Date.now()}-${++counter}`;

// A browser-like client: keeps cookies and sends the CSRF header on writes
const client = () => {
  const agent = request.agent(app);
  return {
    agent,
    get: (url) => agent.get(url),
    post: (url, body) => agent.post(url).set(AJAX).send(body),
    put: (url, body) => agent.put(url).set(AJAX).send(body),
    delete: (url) => agent.delete(url).set(AJAX)
  };
};

// Clears rate-limit counters so one test's deliberate lockout can't leak into
// the next (limiters are keyed by IP, and every test request comes from localhost)
const resetRateLimits = () => {
  const limiters = require('../../middleware/rateLimiter');
  for (const limiter of Object.values(limiters)) {
    for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) limiter.resetKey(ip);
  }
};

const resetDb = () =>
  sequelize.query('TRUNCATE "Carts", "Orders", "Products", "Users", "session" CASCADE');

const createUser = (overrides = {}) =>
  User.create({
    email: `user-${unique()}@example.com`,
    password: 'password123',
    name: 'Test User',
    ...overrides
  });

const createAdmin = (overrides = {}) => createUser({ role: 'admin', ...overrides });

const createProduct = (overrides = {}) =>
  Product.create({
    name: `Product ${unique()}`,
    description: 'A product for testing',
    price: '20.00',
    category: 'Testing',
    stock: 10,
    ...overrides
  });

// Returns a logged-in client for the user
const loginAs = async (user, password = 'password123') => {
  const c = client();
  const res = await c.post('/api/auth/login', { email: user.email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return c;
};

const address = {
  firstName: 'Test',
  lastName: 'Buyer',
  address: '1 Union Street',
  city: 'Aberdeen',
  zipCode: 'AB10 1XG'
};

const closeAll = async () => {
  await app.locals.sessionStore.close();
  await sequelize.close();
};

module.exports = {
  app,
  AJAX,
  client,
  resetDb,
  resetRateLimits,
  createUser,
  createAdmin,
  createProduct,
  loginAs,
  address,
  closeAll,
  request
};
