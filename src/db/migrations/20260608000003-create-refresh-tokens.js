'use strict';

/**
 * Stores issued refresh tokens (as SHA-256 hashes) so they can be rotated and
 * revoked. Enables real logout, "logout everywhere", and refresh-token reuse
 * detection.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = Sequelize;
    await queryInterface.createTable('refresh_tokens', {
      id: { type: t.UUID, defaultValue: t.UUIDV4, primaryKey: true },
      user_id: {
        type: t.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token_hash: { type: t.STRING(64), allowNull: false, unique: true },
      expires_at: { type: t.DATE, allowNull: false },
      revoked_at: { type: t.DATE, allowNull: true },
      replaced_by_hash: { type: t.STRING(64), allowNull: true },
      created_at: { type: t.DATE, allowNull: false },
      updated_at: { type: t.DATE, allowNull: false },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
