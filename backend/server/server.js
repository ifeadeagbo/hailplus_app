require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// On Render the storefront is served from this service's own URL
if (!process.env.CLIENT_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.CLIENT_URL = process.env.RENDER_EXTERNAL_URL;
}

// Refuse to start without the settings the app can't work without
const REQUIRED_ENV = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'SESSION_SECRET', 'CLIENT_URL', 'STRIPE_SECRET_KEY'];
const missingEnv = REQUIRED_ENV.filter(name => !process.env[name] || process.env[name].startsWith('your_'));
if (missingEnv.length > 0) {
  console.error(`Missing or placeholder environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = require('./app');
const { sequelize } = require('./models');
const { createMigrator } = require('./db/migrate');
const { expireStaleOrders } = require('./utils/orderLifecycle');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5050;
const SHUTDOWN_TIMEOUT_MS = 10000;

const start = async () => {
  await sequelize.authenticate();

  // Schema changes are applied by `npm run migrate` as a deploy step,
  // never implicitly at startup
  const pending = await createMigrator().pending();
  if (pending.length > 0) {
    throw new Error(`Database has pending migrations (${pending.map(m => m.name).join(', ')}). Run "npm run migrate" first.`);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Release stock held by checkouts that were never paid
  const sweeper = setInterval(() => {
    expireStaleOrders().catch(err => logger.error('Stale order sweep failed', err));
  }, 5 * 60 * 1000);

  // Hosts send SIGTERM before replacing an instance: finish in-flight
  // requests, then close the database pool
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    clearInterval(sweeper);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch(err => {
  logger.error('Server failed to start', err);
  process.exit(1);
});
