// - Removes the duplicate unique constraints that sync({ alter: true })
//   added on every restart (Users_email_key1 ... key9 and so on)
// - Orders are financial records: deleting a user must not delete them
// - Indexes for the queries the app runs on every request
// - One active cart row per user and product
// - Session table used by connect-pg-simple during social login

const INDEXES = [
  ['carts_user_active', '"Carts" ("userId") WHERE "isActive"'],
  ['carts_product', '"Carts" ("productId")'],
  ['orders_user_created', '"Orders" ("userId", "createdAt" DESC)'],
  ['orders_status_created', '"Orders" ("status", "createdAt")'],
  ['products_active_category', '"Products" ("active", "category")'],
  ['products_active_featured', '"Products" ("active", "featured")']
];

module.exports = {
  async up(queryInterface) {
    const run = (sql) => queryInterface.sequelize.query(sql);

    await run(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT conname, conrelid::regclass AS tbl
          FROM pg_constraint
          WHERE contype = 'u'
            AND connamespace = 'public'::regnamespace
            AND conname ~ '_key[0-9]+$'
        LOOP
          EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
        END LOOP;
      END $$;
    `);

    await run(`
      ALTER TABLE "Orders" DROP CONSTRAINT IF EXISTS "Orders_userId_fkey";
      ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users" (id) ON UPDATE CASCADE ON DELETE RESTRICT;
    `);

    for (const [name, definition] of INDEXES) {
      await run(`CREATE INDEX IF NOT EXISTS ${name} ON ${definition}`);
    }

    await run(`
      CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_row_per_product
      ON "Carts" ("userId", "productId") WHERE "isActive"
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
  },

  async down(queryInterface) {
    const run = (sql) => queryInterface.sequelize.query(sql);

    await run('DROP TABLE IF EXISTS "session"');
    await run('DROP INDEX IF EXISTS carts_one_active_row_per_product');
    for (const [name] of INDEXES) {
      await run(`DROP INDEX IF EXISTS ${name}`);
    }
    await run(`
      ALTER TABLE "Orders" DROP CONSTRAINT IF EXISTS "Orders_userId_fkey";
      ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users" (id) ON UPDATE CASCADE ON DELETE CASCADE;
    `);
  }
};
