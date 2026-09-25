// First-run setup for a new database. Safe to run on every start:
// - creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD when no
//   admin exists yet
// - adds the sample catalogue when there are no products yet
//   (set SAMPLE_PRODUCTS=false to skip)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, User, Product } = require('../models');
const logger = require('../utils/logger');

const strongEnough = (password) =>
  password.length >= 12 && /\d/.test(password) && /[a-zA-Z]/.test(password);

const createAdmin = async () => {
  if (await User.count({ where: { role: 'admin' } }) > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    logger.warn('No admin account yet: set ADMIN_EMAIL and ADMIN_PASSWORD to create one');
    return;
  }
  if (!strongEnough(password)) {
    logger.warn('ADMIN_PASSWORD must be at least 12 characters with a letter and a number; admin not created');
    return;
  }

  await User.create({ email, password, name: 'Store Admin', role: 'admin', emailVerified: true });
  logger.info(`Admin account created for ${email}`);
};

const addSampleProducts = async () => {
  if (process.env.SAMPLE_PRODUCTS === 'false' || await Product.count() > 0) return;
  await Product.bulkCreate(require('../seeds/sampleProducts'));
  logger.info('Sample products added');
};

(async () => {
  try {
    await createAdmin();
    await addSampleProducts();
  } catch (error) {
    logger.error('Bootstrap failed', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
