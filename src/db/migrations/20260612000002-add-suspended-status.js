'use strict';

/** Adds the SUSPENDED status to users.status (offboarding / access revocation). */
const WITH_SUSPENDED = [
  'PENDING_VERIFY', 'DOCS_PENDING', 'DOCS_SUBMITTED', 'ACTIVE', 'REJECTED', 'SUSPENDED',
];
const WITHOUT = [
  'PENDING_VERIFY', 'DOCS_PENDING', 'DOCS_SUBMITTED', 'ACTIVE', 'REJECTED',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'status', {
      type: Sequelize.ENUM(...WITH_SUSPENDED),
      allowNull: false,
      defaultValue: 'PENDING_VERIFY',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'status', {
      type: Sequelize.ENUM(...WITHOUT),
      allowNull: false,
      defaultValue: 'PENDING_VERIFY',
    });
  },
};
