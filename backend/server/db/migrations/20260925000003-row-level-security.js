// Enables Row Level Security with no policies on every app table.
//
// Supabase publishes the public schema through its auto-generated Data API,
// reachable with the project's public anon key. With RLS on and no
// policies, that API can read and write nothing. The app connects as the
// tables' owner, which RLS does not apply to, so it is unaffected.
// Harmless on plain PostgreSQL.

const TABLES = ['Users', 'Products', 'Carts', 'Orders', 'session', 'SequelizeMeta'];

module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
};
