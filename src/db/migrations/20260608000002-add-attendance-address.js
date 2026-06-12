'use strict';

/**
 * Adds human-readable full addresses (reverse-geocoded on the device)
 * for attendance check-in and check-out.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addr = { type: Sequelize.STRING(512), allowNull: true };
    await queryInterface.addColumn('attendance', 'check_in_address', addr);
    await queryInterface.addColumn('attendance', 'check_out_address', addr);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attendance', 'check_in_address');
    await queryInterface.removeColumn('attendance', 'check_out_address');
  },
};
