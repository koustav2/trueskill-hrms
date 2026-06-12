'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_profiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      full_name: { type: Sequelize.STRING(120), allowNull: false },
      avatar_url: { type: Sequelize.STRING(512), allowNull: true },
      address: { type: Sequelize.STRING(255), allowNull: true },
      pincode: { type: Sequelize.STRING(12), allowNull: true },
      department: { type: Sequelize.STRING(80), allowNull: true },
      designation: { type: Sequelize.STRING(80), allowNull: true },
      date_of_joining: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_profiles');
  },
};
