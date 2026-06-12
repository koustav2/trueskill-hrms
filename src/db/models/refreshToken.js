'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      // SHA-256 hash of the issued refresh JWT — never store the raw token.
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
      // Links a rotated token to the one that replaced it (for reuse detection).
      replaced_by_hash: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
      tableName: 'refresh_tokens',
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { unique: true, fields: ['token_hash'] }],
    }
  );
  return RefreshToken;
};
