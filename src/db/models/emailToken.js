'use strict';

const PURPOSES = ['VERIFY', 'RESET'];

module.exports = (sequelize, DataTypes) => {
  const EmailToken = sequelize.define(
    'EmailToken',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      // Store only the SHA-256 hash of the token; the raw token goes in the email link.
      token_hash: { type: DataTypes.STRING(64), allowNull: false },
      purpose: { type: DataTypes.ENUM(...PURPOSES), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'email_tokens', underscored: true }
  );

  EmailToken.PURPOSES = PURPOSES;
  return EmailToken;
};
