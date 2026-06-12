'use strict';

/** Audit: records when a document was verified/rejected (who is already in verified_by). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('documents', 'verified_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('documents', 'verified_at');
  },
};
