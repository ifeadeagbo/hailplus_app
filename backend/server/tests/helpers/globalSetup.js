// Brings the test database schema up to date once before all test files
module.exports = async () => {
  require('./env');
  const sequelize = require('../../config/database');
  const { runMigrations } = require('../../db/migrate');
  await runMigrations(sequelize);
  await sequelize.close();
};
