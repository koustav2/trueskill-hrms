'use strict';

// Demo/sample data has been removed. Running this seeder now CLEANS UP the demo
// account and its records (FK cascade) plus the demo notices, leaving a clean DB
// with only the seeded HR admin. It inserts nothing.
const DEMO_EMAIL = 'demo@trueskill.com';
const DEMO_NOTICE_TITLES = ['Office closed on Friday', 'Annual Town Hall'];

module.exports = {
  async up(queryInterface) {
    const { Op } = queryInterface.sequelize.Sequelize;
    const row = await queryInterface.rawSelect('users', { where: { email: DEMO_EMAIL } }, ['id']);
    if (row) {
      // Cascades to profile, documents, attendance, leaves, salary, tasks, tours,
      // advances and notifications via the ON DELETE CASCADE foreign keys.
      await queryInterface.bulkDelete('users', { id: row });
    }
    // Notices aren't tied to a user, so remove the demo ones explicitly.
    await queryInterface.bulkDelete('notices', { title: { [Op.in]: DEMO_NOTICE_TITLES } });
  },

  async down() {
    /* no-op: demo data is intentionally not recreated */
  },
};
