// Email address confirmation for new accounts
module.exports = {
  async up(queryInterface, Sequelize) {
    // SHA-256 hash of the emailed token (the token itself is never stored)
    await queryInterface.addColumn('Users', 'emailVerificationToken', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Users', 'emailVerificationExpires', { type: Sequelize.DATE, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'emailVerificationExpires');
    await queryInterface.removeColumn('Users', 'emailVerificationToken');
  }
};
