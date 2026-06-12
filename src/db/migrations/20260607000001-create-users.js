'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('EMPLOYEE', 'HR_ADMIN'), allowNull: false, defaultValue: 'EMPLOYEE' },
      status: {
        type: Sequelize.ENUM('PENDING_VERIFY', 'DOCS_PENDING', 'DOCS_SUBMITTED', 'ACTIVE', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING_VERIFY',
      },
      employee_code: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      email_verified_at: { type: Sequelize.DATE, allowNull: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
