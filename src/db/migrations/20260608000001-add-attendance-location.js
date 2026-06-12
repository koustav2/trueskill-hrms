'use strict';

/**
 * Adds geo-location columns for attendance check-in and check-out.
 * Latitude / longitude are stored as DECIMAL(9,6) (~0.11 m precision).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dec = { type: Sequelize.DECIMAL(9, 6), allowNull: true };
    await queryInterface.addColumn('attendance', 'check_in_lat', dec);
    await queryInterface.addColumn('attendance', 'check_in_lng', dec);
    await queryInterface.addColumn('attendance', 'check_out_lat', dec);
    await queryInterface.addColumn('attendance', 'check_out_lng', dec);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attendance', 'check_in_lat');
    await queryInterface.removeColumn('attendance', 'check_in_lng');
    await queryInterface.removeColumn('attendance', 'check_out_lat');
    await queryInterface.removeColumn('attendance', 'check_out_lng');
  },
};
