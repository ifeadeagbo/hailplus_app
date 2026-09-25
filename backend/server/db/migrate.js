// Runs database migrations in db/migrations.
//   npm run migrate          apply all pending migrations
//   npm run migrate:undo     roll back the most recent migration
//   npm run migrate:status   list applied and pending migrations
//
// Migrations use the sequelize-cli format (up(queryInterface, Sequelize))
// and the same SequelizeMeta table, so sequelize-cli can run them too.
const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('../config/database');

const createMigrator = (db = sequelize) => {
  const queryInterface = db.getQueryInterface();
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, 'migrations', '*.js'),
      resolve: ({ name, path: file }) => {
        const migration = require(file);
        return {
          name,
          up: () => migration.up(queryInterface, Sequelize),
          down: () => migration.down(queryInterface, Sequelize)
        };
      }
    },
    storage: new SequelizeStorage({ sequelize: db }),
    logger: undefined
  });
};

const runMigrations = (db) => createMigrator(db).up();

module.exports = { createMigrator, runMigrations };

if (require.main === module) {
  const command = process.argv[2] || 'up';
  const migrator = createMigrator();

  (async () => {
    if (command === 'up') {
      const applied = await migrator.up();
      console.log(applied.length ? `Applied: ${applied.map(m => m.name).join(', ')}` : 'Database is up to date');
    } else if (command === 'down') {
      const reverted = await migrator.down();
      console.log(reverted.length ? `Reverted: ${reverted.map(m => m.name).join(', ')}` : 'Nothing to revert');
    } else if (command === 'status') {
      const executed = await migrator.executed();
      const pending = await migrator.pending();
      executed.forEach(m => console.log(`applied  ${m.name}`));
      pending.forEach(m => console.log(`pending  ${m.name}`));
    } else {
      throw new Error(`Unknown command "${command}" (use up, down or status)`);
    }
    await sequelize.close();
  })().catch(async (error) => {
    console.error('Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  });
}
