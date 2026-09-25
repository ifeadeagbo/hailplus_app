// Test environment. Uses its own database (tables are truncated between
// tests) and dummy secrets; Stripe and email are mocked in the tests.
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ecommerce_test';

// Fills in DB credentials etc. from .env locally; CI sets them directly.
// dotenv never overrides values that are already set above.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const defaults = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRE: '1h',
  SESSION_SECRET: 'test-session-secret',
  CLIENT_URL: 'http://localhost:3000',
  STRIPE_SECRET_KEY: 'sk_test_mocked',
  STRIPE_WEBHOOK_SECRET: 'whsec_mocked'
};
for (const [name, value] of Object.entries(defaults)) {
  if (!process.env[name]) process.env[name] = value;
}

// Tests wipe tables, so never point them at a real database
if (!process.env.DB_NAME.includes('test')) {
  throw new Error(`Refusing to run tests against database "${process.env.DB_NAME}" (name must contain "test")`);
}
