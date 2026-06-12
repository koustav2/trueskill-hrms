'use strict';

const STATUSES = ['APPLIED', 'APPROVED', 'REJECTED'];

module.exports = (sequelize, DataTypes) => {
  const Advance = sequelize.define(
    'Advance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      // Encrypted requested amount (AES-256-GCM payload).
      amount_enc: { type: DataTypes.TEXT, allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'APPLIED' },
      approver_id: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'advances', underscored: true }
  );
  Advance.STATUSES = STATUSES;
  return Advance;
};
