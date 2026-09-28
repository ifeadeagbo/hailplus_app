// Two-factor sign-in (authenticator app codes)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'twoFactorEnabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    // Encrypted TOTP secret (see utils/secretBox.js)
    await queryInterface.addColumn('Users', 'twoFactorSecret', { type: Sequelize.TEXT, allowNull: true });
    // SHA-256 hashes of unused recovery codes
    await queryInterface.addColumn('Users', 'twoFactorRecoveryCodes', { type: Sequelize.JSONB, allowNull: true });
    // Last accepted 30-second time step, so a code can't be used twice
    await queryInterface.addColumn('Users', 'twoFactorLastStep', { type: Sequelize.BIGINT, allowNull: true });
  },

  async down(queryInterface) {
    for (const column of ['twoFactorLastStep', 'twoFactorRecoveryCodes', 'twoFactorSecret', 'twoFactorEnabled']) {
      await queryInterface.removeColumn('Users', column);
    }
  }
};
