// Baseline schema, matching what sequelize.sync() used to create.
// Databases that were already created by sync() keep their tables; this
// migration only records itself as applied there.

const timestamps = (Sequelize) => ({
  createdAt: { type: Sequelize.DATE, allowNull: false },
  updatedAt: { type: Sequelize.DATE, allowNull: false }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.showAllTables();
    if (existing.includes('Users')) {
      return;
    }

    await queryInterface.createTable('Users', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('customer', 'admin'), defaultValue: 'customer' },
      provider: { type: Sequelize.STRING, defaultValue: 'local' },
      googleId: { type: Sequelize.STRING, allowNull: true, unique: true },
      facebookId: { type: Sequelize.STRING, allowNull: true, unique: true },
      stripeCustomerId: { type: Sequelize.STRING, allowNull: true, unique: true },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      tokenVersion: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      emailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      resetPasswordToken: { type: Sequelize.STRING, allowNull: true },
      resetPasswordExpires: { type: Sequelize.DATE, allowNull: true },
      ...timestamps(Sequelize)
    });

    await queryInterface.createTable('Products', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      image: { type: Sequelize.STRING, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: false },
      stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      featured: { type: Sequelize.BOOLEAN, defaultValue: false },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      ...timestamps(Sequelize)
    });

    await queryInterface.createTable('Carts', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      ...timestamps(Sequelize)
    });

    await queryInterface.createTable('Orders', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      items: { type: Sequelize.JSONB, allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      discountCode: { type: Sequelize.STRING, allowNull: true },
      discountAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      tax: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shipping: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
        defaultValue: 'pending'
      },
      paymentMethod: { type: Sequelize.STRING, allowNull: false },
      paymentIntentId: { type: Sequelize.STRING, allowNull: true, unique: true },
      shippingAddress: { type: Sequelize.JSONB, allowNull: false },
      billingAddress: { type: Sequelize.JSONB, allowNull: false },
      trackingNumber: { type: Sequelize.STRING, allowNull: true },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Orders');
    await queryInterface.dropTable('Carts');
    await queryInterface.dropTable('Products');
    await queryInterface.dropTable('Users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_status"; DROP TYPE IF EXISTS "enum_Users_role";');
  }
};
